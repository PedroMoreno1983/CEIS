import { useEffect, useState } from "react";
import { AplicacionesAPI, InstrumentosAPI } from "../api";
import type { Aplicacion, Instrumento, ResultadosAplicacion } from "../types";
import ResultadosView from "../components/ResultadosView";

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-slate-100 text-slate-700",
  en_curso: "bg-amber-100 text-amber-800",
  finalizada: "bg-emerald-100 text-emerald-800",
  cancelada: "bg-rose-100 text-rose-800",
};

export default function AplicacionesPage() {
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [instrumentos, setInstrumentos] = useState<Record<string, Instrumento>>({});
  const [resultadosActivos, setResultadosActivos] = useState<ResultadosAplicacion | null>(null);

  const [crearOpen, setCrearOpen] = useState(false);
  const [instrumentoSel, setInstrumentoSel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    const [apps, insts] = await Promise.all([
      AplicacionesAPI.list(),
      InstrumentosAPI.list(),
    ]);
    setAplicaciones(apps);
    setInstrumentos(Object.fromEntries(insts.map((i) => [i.id, i])));
  };

  useEffect(() => {
    cargar();
  }, []);

  const crear = async () => {
    if (!instrumentoSel) {
      setError("Selecciona una prueba");
      return;
    }
    try {
      await AplicacionesAPI.crear(instrumentoSel);
      setCrearOpen(false);
      setInstrumentoSel("");
      setError(null);
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al crear");
    }
  };

  const verResultados = async (id: string) => {
    const r = await AplicacionesAPI.resultados(id);
    setResultadosActivos(r);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta aplicación y sus respuestas?")) return;
    await AplicacionesAPI.remove(id);
    await cargar();
  };

  const copiarLink = (codigo: string) => {
    const url = `${window.location.origin}/aplicar/${codigo}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aplicaciones</h1>
          <p className="text-slate-600 mt-1">
            Genera códigos de acceso para que tus estudiantes respondan las pruebas en pantalla.
          </p>
        </div>
        <button
          onClick={() => setCrearOpen(!crearOpen)}
          className="bg-ceis-primary text-white px-4 py-2 rounded-md font-medium hover:bg-blue-800"
        >
          {crearOpen ? "Cancelar" : "+ Nueva aplicación"}
        </button>
      </div>

      {crearOpen && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-3">Crear código de acceso</h2>
          <select
            className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm bg-white mb-3"
            value={instrumentoSel}
            onChange={(e) => setInstrumentoSel(e.target.value)}
          >
            <option value="">— Seleccionar prueba —</option>
            {Object.values(instrumentos).map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} ({i.num_items} ítems)
              </option>
            ))}
          </select>
          {error && <p className="text-rose-600 text-sm mb-2">{error}</p>}
          <button
            onClick={crear}
            className="bg-ceis-primary text-white px-4 py-2 rounded font-medium hover:bg-blue-800"
          >
            Generar código
          </button>
        </div>
      )}

      {resultadosActivos && (
        <div className="space-y-2">
          <button
            onClick={() => setResultadosActivos(null)}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Volver a la lista
          </button>
          <ResultadosView resultados={resultadosActivos} modoDocente />
        </div>
      )}

      {!resultadosActivos && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Prueba</th>
                <th className="px-4 py-3">Estudiante</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Puntaje</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aplicaciones.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No hay aplicaciones todavía.
                  </td>
                </tr>
              )}
              {aplicaciones.map((a) => {
                const inst = instrumentos[a.instrumento_id];
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-ceis-primary">{a.codigo}</td>
                    <td className="px-4 py-3 text-slate-700">{inst?.nombre || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {a.estudiante_nombre || <span className="text-slate-400 italic">sin asignar</span>}
                      {a.estudiante_curso && <span className="text-slate-500"> · {a.estudiante_curso}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${ESTADO_COLOR[a.estado]}`}>
                        {ESTADO_LABELS[a.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {a.puntaje_total
                        ? `${a.puntaje_correctas}/${a.puntaje_total} (${Math.round(100 * (a.puntaje_correctas || 0) / a.puntaje_total)}%)`
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => copiarLink(a.codigo)}
                        className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-100"
                        title="Copiar link"
                      >
                        Copiar link
                      </button>
                      <a
                        href={`/aplicar/${a.codigo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-2 py-1 rounded bg-ceis-primary text-white hover:bg-blue-800"
                      >
                        Abrir
                      </a>
                      {a.estado === "finalizada" && (
                        <button
                          onClick={() => verResultados(a.id)}
                          className="text-xs px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Resultados
                        </button>
                      )}
                      <button
                        onClick={() => eliminar(a.id)}
                        className="text-xs px-2 py-1 text-slate-400 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
