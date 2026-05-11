import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AplicacionesAPI } from "../api";
import type { AplicacionParaResponder, Item, ResultadosAplicacion } from "../types";
import { TIPO_LABELS, NIVEL_LABELS } from "../types";
import ResultadosView from "../components/ResultadosView";

type Phase = "carga" | "identidad" | "respondiendo" | "finalizada";

export default function AplicarPage() {
  const { codigo = "" } = useParams();
  const [phase, setPhase] = useState<Phase>("carga");
  const [data, setData] = useState<AplicacionParaResponder | null>(null);
  const [esAdaptativa, setEsAdaptativa] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [curso, setCurso] = useState("");
  const [rut, setRut] = useState("");

  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [resultados, setResultados] = useState<ResultadosAplicacion | null>(null);
  const [transicion, setTransicion] = useState(false);

  // Modo adaptativo: items se cargan uno a uno, theta + SE en vivo
  const [adaptativeItems, setAdaptativeItems] = useState<Item[]>([]);
  const [theta, setTheta] = useState(0);
  const [se, setSe] = useState(1);
  const [motivoTermino, setMotivoTermino] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const itemStartRef = useRef<number>(Date.now());
  const tiempoLimite = useMemo(
    () => (data?.tiempo_minutos ? data.tiempo_minutos * 60 : null),
    [data?.tiempo_minutos]
  );
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);

  const codigoUp = codigo.toUpperCase();

  useEffect(() => {
    Promise.all([
      AplicacionesAPI.cargar(codigoUp),
      AplicacionesAPI.list({}),
    ]).then(async ([d, apps]) => {
      setData(d);
      setRespuestas(d.respuestas_previas || {});
      setNombre(d.estudiante_nombre || "");
      setCurso(d.estudiante_curso || "");
      const app = apps.find((a) => a.codigo === codigoUp);
      const adaptativa = !!(app as any)?.es_adaptativa;
      setEsAdaptativa(adaptativa);
      if (app) {
        setTheta(Number(app.theta_actual ?? 0));
        setSe(Number(app.se_actual ?? 1));
      }

      if (d.estado === "finalizada") {
        const r = await AplicacionesAPI.finalizar(codigoUp);
        setResultados(r);
        setPhase("finalizada");
      } else if (d.estado === "en_curso" && d.estudiante_nombre) {
        setPhase("respondiendo");
        startedAtRef.current = Date.now();
        itemStartRef.current = Date.now();
        if (adaptativa) await pedirSiguiente(codigoUp);
      } else {
        setPhase("identidad");
      }
    }).catch((e) => setError(e?.response?.data?.detail || "No se pudo cargar"));
  }, [codigoUp]);

  const pedirSiguiente = async (cod: string = codigoUp) => {
    const r = await AplicacionesAPI.siguienteItem(cod);
    setTheta(r.theta_actual);
    setSe(r.se_actual);
    if (r.item) {
      setAdaptativeItems((prev) => {
        if (prev.find((p) => p.id === r.item!.id)) return prev;
        return [...prev, r.item!];
      });
      setIdx((prev) => prev + (adaptativeItems.length === 0 ? 0 : 1));
    } else {
      setMotivoTermino(r.motivo_termino || "fin");
      finalizar();
    }
  };

  useEffect(() => {
    if (phase !== "respondiendo" || !tiempoLimite) return;
    const tick = () => {
      const transcurrido = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const restante = tiempoLimite - transcurrido;
      setTiempoRestante(restante);
      if (restante <= 0) finalizar();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, tiempoLimite]);

  const iniciar = async () => {
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setError(null);
    await AplicacionesAPI.iniciar(codigoUp, {
      estudiante_nombre: nombre,
      estudiante_curso: curso || undefined,
      estudiante_rut: rut || undefined,
    });
    startedAtRef.current = Date.now();
    itemStartRef.current = Date.now();
    setPhase("respondiendo");
    if (esAdaptativa) await pedirSiguiente();
  };

  const responder = async (item: Item, clave: string) => {
    const prev = respuestas[item.id];
    setRespuestas({ ...respuestas, [item.id]: clave });
    const tiempo = Math.floor((Date.now() - itemStartRef.current) / 1000);
    try {
      const r = await AplicacionesAPI.responder(codigoUp, {
        item_id: item.id,
        respuesta: clave,
        tiempo_segundos: tiempo,
      });
      if (esAdaptativa && r?.data) {
        setTheta(r.data.theta_actual);
        setSe(r.data.se_actual);
      }
    } catch {
      setRespuestas({ ...respuestas, [item.id]: prev || "" });
      setError("No se pudo guardar la respuesta. Inténtalo de nuevo.");
    }
  };

  const cambiarItem = (nuevo: number) => {
    if (!data) return;
    setTransicion(true);
    setTimeout(() => {
      setIdx(nuevo);
      itemStartRef.current = Date.now();
      setTransicion(false);
    }, 150);
  };

  const siguiente = async () => {
    if (!data) return;
    if (esAdaptativa) {
      // Pedir siguiente ítem al backend (CAT)
      setTransicion(true);
      await pedirSiguiente();
      setIdx(adaptativeItems.length);  // se incrementa cuando llega el nuevo
      itemStartRef.current = Date.now();
      setTimeout(() => setTransicion(false), 150);
      return;
    }
    if (idx < data.items.length - 1) cambiarItem(idx + 1);
    else finalizar();
  };

  const anterior = () => {
    if (esAdaptativa) return;  // no se puede retroceder en CAT
    if (idx > 0) cambiarItem(idx - 1);
  };

  const finalizar = async () => {
    const r = await AplicacionesAPI.finalizar(codigoUp);
    setResultados(r);
    setPhase("finalizada");
  };

  if (phase === "carga") {
    return (
      <Shell>
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-4">Cargando prueba...</p>
        </div>
      </Shell>
    );
  }

  if (error && !data) {
    return (
      <Shell>
        <div className="bg-white border border-rose-200 px-8 py-6 rounded-2xl max-w-md shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mb-3">
            <span className="text-2xl">⚠</span>
          </div>
          <h2 className="font-bold text-lg text-slate-900">No pudimos cargar tu prueba</h2>
          <p className="text-slate-600 mt-2">{error}</p>
          <p className="text-xs text-slate-400 mt-3">Verifica el código que te entregaron.</p>
        </div>
      </Shell>
    );
  }

  if (!data) return null;

  if (phase === "finalizada" && resultados) {
    return (
      <Shell>
        <ResultadosView resultados={resultados} />
      </Shell>
    );
  }

  if (phase === "identidad") {
    return (
      <Shell>
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-200 font-semibold">
                CEIS Maristas
              </p>
              <p className="text-xs text-blue-300 mt-0.5">Código de acceso · {codigoUp}</p>
              <h1 className="text-2xl font-bold mt-4 leading-tight">{data.instrumento_nombre}</h1>
              <p className="text-blue-100 mt-1">
                {TIPO_LABELS[data.instrumento_tipo]} · {NIVEL_LABELS[data.instrumento_nivel]}
              </p>
              <div className="flex gap-6 mt-5 pt-4 border-t border-blue-400/40 text-sm">
                <div>
                  <p className="text-xs text-blue-200">Ítems</p>
                  <p className="font-semibold">{data.items.length}</p>
                </div>
                {data.tiempo_minutos && (
                  <div>
                    <p className="text-xs text-blue-200">Tiempo</p>
                    <p className="font-semibold">{data.tiempo_minutos} minutos</p>
                  </div>
                )}
              </div>
            </div>

            {data.instrucciones && (
              <div className="px-8 py-5 border-b border-slate-100 bg-blue-50/40">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                  Instrucciones
                </p>
                <p className="text-slate-700 text-sm leading-relaxed">{data.instrucciones}</p>
              </div>
            )}

            <div className="p-8 space-y-4">
              <Field label="Tu nombre completo" required>
                <input
                  type="text"
                  className="w-full rounded-lg border-slate-200 border-2 px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoFocus
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Curso">
                  <input
                    type="text"
                    placeholder="Ej: 2°A"
                    className="w-full rounded-lg border-slate-200 border-2 px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                    value={curso}
                    onChange={(e) => setCurso(e.target.value)}
                  />
                </Field>
                <Field label="RUT">
                  <input
                    type="text"
                    placeholder="opcional"
                    className="w-full rounded-lg border-slate-200 border-2 px-4 py-3 focus:border-blue-500 focus:outline-none transition"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                  />
                </Field>
              </div>
              {error && (
                <p className="text-rose-600 text-sm bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
              )}
              <button
                onClick={iniciar}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white py-4 rounded-lg font-semibold shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300"
              >
                Comenzar prueba →
              </button>
              <p className="text-xs text-slate-400 text-center">
                Tus respuestas se guardan automáticamente. Si se corta tu sesión, podrás continuar
                desde donde quedaste.
              </p>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // respondiendo
  const itemsActuales = esAdaptativa ? adaptativeItems : data.items;
  const item = itemsActuales[idx];
  if (!item) {
    return (
      <Shell>
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-4">Calculando próximo ítem...</p>
        </div>
      </Shell>
    );
  }
  const respondidos = Object.keys(respuestas).length;
  const totalEsperado = esAdaptativa ? (data as any).max_items || 30 : data.items.length;
  const progreso = esAdaptativa
    ? Math.min(100, Math.max(10, (1 - se) * 100))  // CAT: progreso = certidumbre (1 - SE)
    : ((idx + 1) / data.items.length) * 100;
  const respondidaActual = !!respuestas[item.id];
  const tieneOpcionesVacias = item.opciones?.some((o) => !o.texto);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">
              CEIS · {NIVEL_LABELS[data.instrumento_nivel]}
            </p>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {data.instrumento_nombre}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">
              {data.estudiante_nombre || nombre}{curso ? ` · ${curso}` : ""}
            </p>
            {esAdaptativa ? (
              <p className="text-xs text-slate-400">
                Adaptativa · ítem <span className="font-semibold text-slate-700">{respondidos + 1}</span>
                {" · "}
                <span className="text-purple-700 font-mono">θ={theta.toFixed(2)}</span>
                {" · "}
                <span className={`font-mono ${se < 0.4 ? "text-emerald-600" : "text-slate-500"}`}>SE={se.toFixed(2)}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Ítem <span className="font-semibold text-slate-700">{idx + 1}</span> de {data.items.length} · {respondidos} ✓
              </p>
            )}
          </div>
          {tiempoRestante !== null && (
            <div
              className={`px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
                tiempoRestante < 60
                  ? "bg-rose-100 text-rose-700 animate-pulse"
                  : tiempoRestante < 180
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {formatTiempo(tiempoRestante)}
            </div>
          )}
        </div>
        <div className="h-1 bg-slate-100">
          <div
            className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className={`transition-all duration-150 ${transicion ? "opacity-0 translate-y-2" : "opacity-100"}`}>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            {item.texto_base && (
              <div className="px-8 py-5 bg-slate-50 border-b border-slate-200">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
                  Lectura
                </p>
                <p className="text-slate-700 leading-relaxed">{item.texto_base}</p>
              </div>
            )}

            <div className="px-8 py-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm shadow-md">
                  {idx + 1}
                </span>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                  {TIPO_LABELS[item.tipo as keyof typeof TIPO_LABELS] || item.tipo}
                </p>
              </div>

              {item.enunciado && (
                <p className="text-xl text-slate-900 leading-relaxed mb-5 font-medium">
                  {item.enunciado}
                </p>
              )}

              {item.imagen_url && (
                <div className="mb-6 -mx-2 rounded-xl overflow-hidden bg-white border-2 border-slate-200">
                  <img
                    src={`/uploads/${item.imagen_url}`}
                    alt="Ítem"
                    className="w-full max-h-[36rem] object-contain bg-white"
                  />
                </div>
              )}
            </div>

            {item.opciones && (
              <div className="px-8 pb-8">
                {tieneOpcionesVacias ? (
                  <div className="grid grid-cols-5 gap-2">
                    {item.opciones.map((op) => {
                      const seleccionada = respuestas[item.id] === op.clave;
                      return (
                        <button
                          key={op.clave}
                          onClick={() => responder(item, op.clave)}
                          className={`aspect-square rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                            seleccionada
                              ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:scale-105"
                          }`}
                        >
                          {op.clave}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {item.opciones.map((op) => {
                      const seleccionada = respuestas[item.id] === op.clave;
                      return (
                        <button
                          key={op.clave}
                          onClick={() => responder(item, op.clave)}
                          className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-start gap-4 group ${
                            seleccionada
                              ? "border-blue-600 bg-blue-50 shadow-md shadow-blue-100"
                              : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                          }`}
                        >
                          <span
                            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                              seleccionada
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700"
                            }`}
                          >
                            {op.clave}
                          </span>
                          <span className="text-slate-800 leading-relaxed text-base pt-1.5">
                            {op.texto}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 px-2">
          <button
            onClick={anterior}
            disabled={idx === 0 || esAdaptativa}
            className={`px-5 py-2.5 text-sm rounded-lg border-2 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed font-medium ${esAdaptativa ? "invisible" : ""}`}
          >
            ← Anterior
          </button>

          <div className="flex items-center gap-2">
            {respondidaActual ? (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Guardada
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                Sin responder
              </span>
            )}
          </div>

          <button
            onClick={siguiente}
            className="px-6 py-2.5 text-sm rounded-lg bg-gradient-to-r from-blue-700 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg hover:from-blue-800 transition-all"
          >
            {idx < data.items.length - 1 ? "Siguiente →" : "Finalizar prueba"}
          </button>
        </div>

        <div className={`mt-8 flex flex-wrap gap-1.5 justify-center ${esAdaptativa ? "hidden" : ""}`}>
          {data.items.map((_, i) => {
            const it = data.items[i];
            const respondida = !!respuestas[it.id];
            return (
              <button
                key={i}
                onClick={() => cambiarItem(i)}
                className={`w-8 h-8 text-xs rounded-md font-semibold transition-all ${
                  i === idx
                    ? "bg-blue-700 text-white shadow-md scale-110"
                    : respondida
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                title={`Ítem ${i + 1}${respondida ? " (respondido)" : ""}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 overflow-y-auto py-10 px-4 flex items-start justify-center">
      <div className="w-full flex justify-center">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function formatTiempo(s: number): string {
  if (s < 0) s = 0;
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${String(ss).padStart(2, "0")}`;
}
