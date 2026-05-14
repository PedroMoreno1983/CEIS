import { useEffect, useMemo, useState } from "react";
import { ColegiosAPI, CursosAPI } from "../api-gestion";
import {
  AnotacionesAPI, AsistenciaAPI, CalificacionesAPI, CargaAPI, PeriodosAPI,
} from "../api-libro";
import type { Colegio, Curso, Estudiante } from "../types-gestion";
import { NIVEL_CURSO_LABELS } from "../types-gestion";
import type {
  Anotacion, Asistencia, Calificacion, Carga, EstadoAsistencia, Periodo, TipoAnotacion,
} from "../types-libro";
import {
  ESTADO_ASISTENCIA_COLOR, ESTADO_ASISTENCIA_LABELS, ESTADO_ASISTENCIA_LETRA,
  TIPO_ANOTACION_COLOR, TIPO_ANOTACION_LABELS,
} from "../types-libro";

type Tab = "notas" | "asistencia" | "anotaciones";

const ESTADOS: EstadoAsistencia[] = ["presente", "atrasado", "ausente", "justificado", "retirado"];
const TIPOS_ANOT: TipoAnotacion[] = ["positiva", "neutra", "negativa"];

const today = () => new Date().toISOString().slice(0, 10);

export default function LibroClasesPage() {
  // Contexto
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [colegioId, setColegioId] = useState<string>(() => localStorage.getItem("libro.colegioId") || "");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState<string>(() => localStorage.getItem("libro.cursoId") || "");
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId] = useState<string>(() => localStorage.getItem("libro.periodoId") || "");
  const [tab, setTab] = useState<Tab>("notas");

  // Datos del curso
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [carga, setCarga] = useState<Carga[]>([]);

  useEffect(() => { ColegiosAPI.list().then((cs) => { setColegios(cs); if (cs.length && !colegioId) setColegioId(cs[0].id); }); }, []);

  useEffect(() => {
    if (!colegioId) return;
    localStorage.setItem("libro.colegioId", colegioId);
    CursosAPI.list({ colegio_id: colegioId }).then(setCursos);
    PeriodosAPI.list({ colegio_id: colegioId, activo: true }).then((ps) => {
      setPeriodos(ps);
      if (ps.length && !periodoId) setPeriodoId(ps[0].id);
    });
  }, [colegioId]);

  useEffect(() => {
    if (!cursoId) { setEstudiantes([]); setCarga([]); return; }
    localStorage.setItem("libro.cursoId", cursoId);
    CursosAPI.estudiantes(cursoId).then(setEstudiantes);
    CargaAPI.porCurso(cursoId).then(setCarga);
  }, [cursoId]);

  useEffect(() => {
    if (periodoId) localStorage.setItem("libro.periodoId", periodoId);
  }, [periodoId]);

  const cursoSel = cursos.find((c) => c.id === cursoId);
  const periodoSel = periodos.find((p) => p.id === periodoId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Libro de clases</h1>
        <p className="text-slate-600 mt-1">Notas, asistencia y anotaciones por curso y período.</p>
      </div>

      {/* Selectores */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
        <Selector label="Colegio" value={colegioId} onChange={setColegioId} options={colegios.map((c) => ({ id: c.id, label: c.nombre }))} />
        <Selector
          label="Curso"
          value={cursoId}
          onChange={setCursoId}
          options={cursos.map((c) => ({ id: c.id, label: `${NIVEL_CURSO_LABELS[c.nivel]} ${c.letra} · ${c.ano}` }))}
        />
        <Selector
          label="Período"
          value={periodoId}
          onChange={setPeriodoId}
          options={periodos.map((p) => ({ id: p.id, label: p.nombre }))}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-1">
        {(["notas", "asistencia", "anotaciones"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-ceis-primary text-ceis-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "notas" ? "Notas" : t === "asistencia" ? "Asistencia" : "Anotaciones"}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      {!cursoId ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center text-slate-500">
          Selecciona un curso para empezar.
        </div>
      ) : tab === "notas" ? (
        <TabNotas
          cursoId={cursoId}
          periodoId={periodoId}
          estudiantes={estudiantes}
          carga={carga}
          cursoLabel={cursoSel ? `${NIVEL_CURSO_LABELS[cursoSel.nivel]} ${cursoSel.letra}` : ""}
          periodoLabel={periodoSel?.nombre}
        />
      ) : tab === "asistencia" ? (
        <TabAsistencia cursoId={cursoId} estudiantes={estudiantes} />
      ) : (
        <TabAnotaciones cursoId={cursoId} estudiantes={estudiantes} carga={carga} />
      )}
    </div>
  );
}

// ============================================================
// Tab Notas
// ============================================================

function TabNotas({
  cursoId, periodoId, estudiantes, carga, cursoLabel, periodoLabel,
}: {
  cursoId: string; periodoId: string;
  estudiantes: Estudiante[]; carga: Carga[];
  cursoLabel: string; periodoLabel?: string;
}) {
  const [notas, setNotas] = useState<Calificacion[]>([]);
  const [evalForm, setEvalForm] = useState<EvalFormState | null>(null);

  const cargar = async () => {
    if (!cursoId || !periodoId) { setNotas([]); return; }
    setNotas(await CalificacionesAPI.list({ curso_id: cursoId, periodo_id: periodoId }));
  };

  useEffect(() => { cargar(); }, [cursoId, periodoId]);

  // Agrupar por (asignatura_id, descripcion, fecha) → una "columna" de evaluación
  const columnas = useMemo(() => {
    const map = new Map<string, { asignatura_id: string; asignatura_codigo: string; descripcion: string; fecha: string; tipo: string | null }>();
    for (const n of notas) {
      const key = `${n.asignatura_id}|${n.descripcion}|${n.fecha}`;
      if (!map.has(key)) {
        map.set(key, {
          asignatura_id: n.asignatura_id,
          asignatura_codigo: n.asignatura_codigo || "?",
          descripcion: n.descripcion,
          fecha: n.fecha,
          tipo: n.tipo || null,
        });
      }
    }
    return [...map.values()].sort((a, b) => {
      if (a.asignatura_codigo !== b.asignatura_codigo) return a.asignatura_codigo.localeCompare(b.asignatura_codigo);
      return a.fecha.localeCompare(b.fecha);
    });
  }, [notas]);

  // Mapa rápido (estudiante, col) → nota
  const notaPorCelda = useMemo(() => {
    const m = new Map<string, Calificacion>();
    for (const n of notas) {
      m.set(`${n.estudiante_id}|${n.asignatura_id}|${n.descripcion}|${n.fecha}`, n);
    }
    return m;
  }, [notas]);

  // Promedio por estudiante por asignatura (simple, ponderado por `ponderacion`)
  const promediosPorAsignatura = useMemo(() => {
    const acc = new Map<string, { suma: number; peso: number }>();
    for (const n of notas) {
      if (n.nota == null) continue;
      const key = `${n.estudiante_id}|${n.asignatura_id}`;
      const cur = acc.get(key) || { suma: 0, peso: 0 };
      cur.suma += parseFloat(n.nota) * n.ponderacion;
      cur.peso += n.ponderacion;
      acc.set(key, cur);
    }
    const out = new Map<string, number>();
    acc.forEach((v, k) => { if (v.peso > 0) out.set(k, v.suma / v.peso); });
    return out;
  }, [notas]);

  const asignaturasUnicas = useMemo(() => {
    const seen = new Map<string, string>();
    columnas.forEach((c) => seen.set(c.asignatura_id, c.asignatura_codigo));
    return [...seen.entries()].map(([id, codigo]) => ({ id, codigo }));
  }, [columnas]);

  if (!periodoId) {
    return <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center text-slate-500">Selecciona un período.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          {cursoLabel} · {periodoLabel} · {estudiantes.length} estudiantes · {columnas.length} evaluaciones
        </p>
        <button
          onClick={() => setEvalForm({
            asignatura_id: carga[0]?.asignatura_id || "",
            descripcion: "",
            fecha: today(),
            tipo: "coef_1",
            ponderacion: 100,
            notas: Object.fromEntries(estudiantes.map((e) => [e.id, ""])),
          })}
          className="bg-ceis-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800"
        >
          + Nueva evaluación
        </button>
      </div>

      {evalForm && (
        <NuevaEvaluacionForm
          form={evalForm}
          setForm={setEvalForm}
          estudiantes={estudiantes}
          carga={carga}
          periodoId={periodoId}
          onSaved={async () => { setEvalForm(null); await cargar(); }}
          onCancel={() => setEvalForm(null)}
        />
      )}

      {estudiantes.length === 0 ? (
        <p className="text-slate-400 italic">Este curso no tiene estudiantes matriculados.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase tracking-wider text-slate-500 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                  Estudiante
                </th>
                {columnas.map((col) => (
                  <th key={`${col.asignatura_id}|${col.descripcion}|${col.fecha}`} className="px-2 py-2 text-center border-l border-slate-100" title={`${col.asignatura_codigo} · ${col.descripcion}`}>
                    <div className="text-[10px] font-semibold text-ceis-primary">{col.asignatura_codigo}</div>
                    <div className="text-xs text-slate-700 max-w-[120px] truncate">{col.descripcion}</div>
                    <div className="text-[10px] text-slate-400">{col.fecha}</div>
                  </th>
                ))}
                {asignaturasUnicas.map((a) => (
                  <th key={`prom-${a.id}`} className="px-2 py-2 text-center border-l-2 border-slate-300 bg-slate-100">
                    <div className="text-[10px] font-semibold text-slate-700">Prom {a.codigo}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {estudiantes.map((est) => (
                <tr key={est.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r border-slate-200">
                    <div className="text-slate-900 font-medium">{est.apellido_paterno}, {est.nombres.split(" ")[0]}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{est.rut}</div>
                  </td>
                  {columnas.map((col) => {
                    const cal = notaPorCelda.get(`${est.id}|${col.asignatura_id}|${col.descripcion}|${col.fecha}`);
                    return (
                      <td
                        key={`${est.id}|${col.asignatura_id}|${col.descripcion}|${col.fecha}`}
                        className="px-2 py-2 text-center border-l border-slate-100 cursor-pointer hover:bg-blue-50"
                        onClick={() => cal && editarNotaInline(cal, cargar)}
                      >
                        {cal?.nota
                          ? <span className={`font-mono font-semibold ${parseFloat(cal.nota) < 4 ? "text-rose-600" : "text-slate-900"}`}>
                              {parseFloat(cal.nota).toFixed(1)}
                            </span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                    );
                  })}
                  {asignaturasUnicas.map((a) => {
                    const p = promediosPorAsignatura.get(`${est.id}|${a.id}`);
                    return (
                      <td key={`prom-${est.id}-${a.id}`} className="px-2 py-2 text-center border-l-2 border-slate-300 bg-slate-50">
                        {p != null
                          ? <span className={`font-mono font-bold ${p < 4 ? "text-rose-600" : "text-emerald-700"}`}>{p.toFixed(1)}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

async function editarNotaInline(cal: Calificacion, recargar: () => Promise<void>) {
  const actual = cal.nota || "";
  const nueva = prompt(`Editar nota de ${cal.estudiante_nombre || ""}\n${cal.descripcion} (${cal.fecha})\n\nValor 1.0–7.0 (vacío para quitar):`, actual);
  if (nueva === null) return;
  const trimmed = nueva.trim();
  if (trimmed === "") {
    await CalificacionesAPI.update(cal.id, { nota: null } as any);
  } else {
    const n = parseFloat(trimmed.replace(",", "."));
    if (isNaN(n) || n < 1 || n > 7) { alert("Nota fuera de rango 1.0-7.0"); return; }
    await CalificacionesAPI.update(cal.id, { nota: n.toFixed(1) } as any);
  }
  await recargar();
}

// ============================================================
// Sub-form: Nueva evaluación (bulk)
// ============================================================

type EvalFormState = {
  asignatura_id: string;
  descripcion: string;
  fecha: string;
  tipo: string;
  ponderacion: number;
  notas: Record<string, string>;  // estudiante_id → nota como string
};

function NuevaEvaluacionForm({
  form, setForm, estudiantes, carga, periodoId, onSaved, onCancel,
}: {
  form: EvalFormState;
  setForm: (f: EvalFormState | null) => void;
  estudiantes: Estudiante[];
  carga: Carga[];
  periodoId: string;
  onSaved: () => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    if (!form.asignatura_id) { setError("Selecciona una asignatura"); return; }
    if (!form.descripcion.trim()) { setError("Falta descripción"); return; }
    if (!form.fecha) { setError("Falta fecha"); return; }

    const items: { estudiante_id: string; nota: number | null }[] = [];
    for (const e of estudiantes) {
      const v = (form.notas[e.id] || "").trim().replace(",", ".");
      if (v === "") {
        items.push({ estudiante_id: e.id, nota: null });
      } else {
        const n = parseFloat(v);
        if (isNaN(n) || n < 1 || n > 7) {
          setError(`Nota inválida para ${e.apellido_paterno}, ${e.nombres.split(" ")[0]}: "${v}"`);
          return;
        }
        items.push({ estudiante_id: e.id, nota: n });
      }
    }

    try {
      const docente_id = carga.find((c) => c.asignatura_id === form.asignatura_id)?.docente_id;
      await CalificacionesAPI.bulk({
        asignatura_id: form.asignatura_id,
        periodo_id: periodoId,
        docente_id,
        descripcion: form.descripcion.trim(),
        fecha: form.fecha,
        ponderacion: form.ponderacion,
        tipo: form.tipo || undefined,
        notas: items,
      });
      await onSaved();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-ceis-accent border-l-4 p-6 space-y-4">
      <h3 className="font-semibold text-slate-900">Nueva evaluación</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Field label="Asignatura *">
          <select value={form.asignatura_id} onChange={(e) => setForm({ ...form, asignatura_id: e.target.value })} className={`${input} bg-white`}>
            <option value="">—</option>
            {carga.map((c) => (
              <option key={c.asignatura_id} value={c.asignatura_id}>
                {c.asignatura_codigo} · {c.asignatura_nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Descripción *">
          <input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Prueba unidad 2" className={input} />
        </Field>
        <Field label="Fecha *">
          <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className={input} />
        </Field>
        <Field label="Tipo">
          <input value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} placeholder="coef_1, coef_2…" className={input} />
        </Field>
        <Field label="Ponderación">
          <input type="number" min={1} max={1000} value={form.ponderacion} onChange={(e) => setForm({ ...form, ponderacion: Number(e.target.value) })} className={input} />
        </Field>
      </div>

      <div>
        <div className="text-xs font-medium text-slate-700 mb-2">Notas de los estudiantes (vacío = pendiente)</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {estudiantes.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 truncate">{e.apellido_paterno}, {e.nombres.split(" ")[0]}</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.notas[e.id] || ""}
                onChange={(ev) => setForm({ ...form, notas: { ...form.notas, [e.id]: ev.target.value } })}
                placeholder="-"
                className="w-16 text-center font-mono rounded border border-slate-300 px-2 py-1"
              />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-rose-600 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button onClick={guardar} className="bg-ceis-primary text-white px-4 py-2 rounded font-medium hover:bg-blue-800">
          Guardar evaluación
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50">Cancelar</button>
      </div>
    </div>
  );
}

// ============================================================
// Tab Asistencia
// ============================================================

function TabAsistencia({ cursoId, estudiantes }: { cursoId: string; estudiantes: Estudiante[] }) {
  const [fecha, setFecha] = useState<string>(today());
  const [registros, setRegistros] = useState<Record<string, EstadoAsistencia>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const cargar = async () => {
    if (!cursoId || !fecha) return;
    const existentes = await AsistenciaAPI.delDia(cursoId, fecha);
    const r: Record<string, EstadoAsistencia> = {};
    const o: Record<string, string> = {};
    for (const a of existentes) {
      r[a.estudiante_id] = a.estado;
      if (a.observacion) o[a.estudiante_id] = a.observacion;
    }
    setRegistros(r);
    setObservaciones(o);
  };

  useEffect(() => { cargar(); }, [cursoId, fecha]);

  const setEstado = (estId: string, estado: EstadoAsistencia) => {
    setRegistros({ ...registros, [estId]: estado });
  };

  const guardar = async () => {
    setGuardando(true);
    setMsg(null);
    try {
      const items = estudiantes
        .filter((e) => registros[e.id])
        .map((e) => ({
          estudiante_id: e.id,
          estado: registros[e.id],
          observacion: observaciones[e.id] || undefined,
        }));
      if (items.length === 0) {
        setMsg("No hay registros para guardar.");
        return;
      }
      await AsistenciaAPI.registrarCurso({ curso_id: cursoId, fecha, registros: items });
      setMsg(`Asistencia guardada (${items.length} registros).`);
    } catch (e: any) {
      setMsg(e?.response?.data?.detail || "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  // Marcar todos como presentes
  const marcarTodosPresentes = () => {
    const r = { ...registros };
    for (const e of estudiantes) r[e.id] = "presente";
    setRegistros(r);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <Field label="Fecha">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={input} />
        </Field>
        <button onClick={marcarTodosPresentes} className="text-sm px-3 py-2 rounded border border-slate-300 hover:bg-slate-50">
          Marcar todos presentes
        </button>
        <button onClick={guardar} disabled={guardando} className="bg-ceis-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
          {guardando ? "Guardando…" : "Guardar asistencia"}
        </button>
        {msg && <span className="text-sm text-slate-600">{msg}</span>}
      </div>

      {estudiantes.length === 0 ? (
        <p className="text-slate-400 italic">Sin estudiantes matriculados.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2">N°</th>
                <th className="px-3 py-2">Estudiante</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2">Observación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {estudiantes.map((e, idx) => {
                const sel = registros[e.id];
                return (
                  <tr key={e.id}>
                    <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">{e.apellido_paterno} {e.apellido_materno || ""}, {e.nombres}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{e.rut}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center gap-1">
                        {ESTADOS.map((est) => (
                          <button
                            key={est}
                            onClick={() => setEstado(e.id, est)}
                            title={ESTADO_ASISTENCIA_LABELS[est]}
                            className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                              sel === est
                                ? ESTADO_ASISTENCIA_COLOR[est] + " ring-2 ring-offset-1 ring-slate-400"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {ESTADO_ASISTENCIA_LETRA[est]}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={observaciones[e.id] || ""}
                        onChange={(ev) => setObservaciones({ ...observaciones, [e.id]: ev.target.value })}
                        placeholder="Opcional…"
                        className="w-full text-sm rounded border border-slate-200 px-2 py-1"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-slate-500 flex gap-3 flex-wrap">
        {ESTADOS.map((est) => (
          <span key={est}><strong>{ESTADO_ASISTENCIA_LETRA[est]}</strong> = {ESTADO_ASISTENCIA_LABELS[est]}</span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Tab Anotaciones
// ============================================================

type AnotFormState = {
  estudiante_id: string;
  asignatura_id: string;
  tipo: TipoAnotacion;
  categoria: string;
  fecha: string;
  descripcion: string;
};

function TabAnotaciones({ cursoId, estudiantes, carga }: { cursoId: string; estudiantes: Estudiante[]; carga: Carga[] }) {
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>([]);
  const [form, setForm] = useState<AnotFormState | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    if (!cursoId) return;
    setAnotaciones(await AnotacionesAPI.list({
      curso_id: cursoId,
      tipo: filtroTipo || undefined,
    }));
  };

  useEffect(() => { cargar(); }, [cursoId, filtroTipo]);

  const abrirNuevo = () => {
    setError(null);
    setForm({
      estudiante_id: estudiantes[0]?.id || "",
      asignatura_id: "",
      tipo: "neutra",
      categoria: "",
      fecha: today(),
      descripcion: "",
    });
  };

  const guardar = async () => {
    if (!form) return;
    if (!form.estudiante_id) { setError("Selecciona un estudiante"); return; }
    if (!form.descripcion.trim()) { setError("Falta la descripción"); return; }
    try {
      await AnotacionesAPI.create({
        ...form,
        asignatura_id: form.asignatura_id || null,
        categoria: form.categoria || null,
      } as any);
      setForm(null);
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  const eliminar = async (a: Anotacion) => {
    if (!confirm("¿Eliminar esta anotación?")) return;
    await AnotacionesAPI.remove(a.id);
    await cargar();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="rounded border border-slate-300 px-3 py-1.5 text-sm bg-white">
            <option value="">Todas las anotaciones</option>
            {TIPOS_ANOT.map((t) => <option key={t} value={t}>{TIPO_ANOTACION_LABELS[t]}</option>)}
          </select>
        </div>
        <button
          onClick={form ? () => setForm(null) : abrirNuevo}
          className="bg-ceis-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-800"
        >
          {form ? "Cancelar" : "+ Nueva anotación"}
        </button>
      </div>

      {form && (
        <div className="bg-white rounded-lg border border-ceis-accent border-l-4 p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Nueva anotación</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Estudiante *">
              <select value={form.estudiante_id} onChange={(e) => setForm({ ...form, estudiante_id: e.target.value })} className={`${input} bg-white`}>
                <option value="">—</option>
                {estudiantes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.apellido_paterno} {e.apellido_materno || ""}, {e.nombres}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Asignatura (opcional)">
              <select value={form.asignatura_id} onChange={(e) => setForm({ ...form, asignatura_id: e.target.value })} className={`${input} bg-white`}>
                <option value="">— sin asignatura —</option>
                {carga.map((c) => (
                  <option key={c.asignatura_id} value={c.asignatura_id}>{c.asignatura_codigo} · {c.asignatura_nombre}</option>
                ))}
              </select>
            </Field>
            <Field label="Fecha *">
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className={input} />
            </Field>
            <Field label="Tipo *">
              <div className="flex gap-2">
                {TIPOS_ANOT.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, tipo: t })}
                    className={`flex-1 text-xs px-2 py-2 rounded border transition-colors ${
                      form.tipo === t ? TIPO_ANOTACION_COLOR[t] + " font-semibold" : "border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {TIPO_ANOTACION_LABELS[t]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Categoría">
              <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="conducta / esfuerzo / respeto…" className={input} />
            </Field>
          </div>
          <Field label="Descripción *">
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Detalle de lo ocurrido…"
              className={`${input} resize-y`}
            />
          </Field>
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} className="bg-ceis-primary text-white px-4 py-2 rounded font-medium hover:bg-blue-800">
              Guardar anotación
            </button>
            <button onClick={() => setForm(null)} className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50">Cancelar</button>
          </div>
        </div>
      )}

      {anotaciones.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center text-slate-400">
          Sin anotaciones en este filtro.
        </div>
      ) : (
        <div className="space-y-2">
          {anotaciones.map((a) => (
            <div key={a.id} className={`bg-white rounded-lg border-l-4 ${TIPO_ANOTACION_COLOR[a.tipo].split(" ").find((c) => c.startsWith("border")) || "border-slate-200"} border-y border-r border-slate-200 p-4 flex gap-3`}>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${TIPO_ANOTACION_COLOR[a.tipo]}`}>
                    {TIPO_ANOTACION_LABELS[a.tipo]}
                  </span>
                  <span className="font-medium text-slate-900">{a.estudiante_nombre}</span>
                  {a.asignatura_nombre && <span className="text-slate-500">· {a.asignatura_nombre}</span>}
                  {a.categoria && <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{a.categoria}</span>}
                  <span className="text-xs text-slate-400 ml-auto">{a.fecha}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{a.descripcion}</p>
                {a.docente_nombre && <p className="text-xs text-slate-400 mt-2">— {a.docente_nombre}</p>}
              </div>
              <button onClick={() => eliminar(a)} className="text-slate-300 hover:text-rose-600 text-sm self-start">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function Selector({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700 block mb-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${input} bg-white min-w-[180px]`}>
        <option value="">—</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
}

const input = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700 block mb-1">{label}</span>
      {children}
    </label>
  );
}
