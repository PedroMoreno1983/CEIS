import { useEffect, useMemo, useRef, useState } from "react";

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
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [colegioId, setColegioId] = useState<string>(() => localStorage.getItem("libro.colegioId") || "");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState<string>(() => localStorage.getItem("libro.cursoId") || "");
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId] = useState<string>(() => localStorage.getItem("libro.periodoId") || "");
  const [tab, setTab] = useState<Tab>("notas");

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
  const colegioSel = colegios.find((c) => c.id === colegioId);

  return (
    <div className="flex flex-col h-full">
      {/* Barra superior tipo toolbar */}
      <div className="bg-white border-b border-[#c5c9d0] flex items-center gap-1 px-2 py-1 shrink-0">
        <div className="flex items-center gap-1">
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
        <div className="ml-auto flex items-center gap-3">
          {cursoSel && (
            <div className="text-[11px] text-[#5a5f69]">
              <span className="font-bold text-[#1a1d23]">{NIVEL_CURSO_LABELS[cursoSel.nivel]} {cursoSel.letra}</span>
              <span className="text-[#9ca3af] mx-1">|</span>
              <span>{cursoSel.ano}</span>
              <span className="text-[#9ca3af] mx-1">|</span>
              <span>{estudiantes.length} alumnos</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs tipo Excel */}
      <div className="bg-[#f3f4f6] border-b border-[#c5c9d0] flex shrink-0">
        {(["notas", "asistencia", "anotaciones"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1 text-[11px] font-semibold border-r border-[#c5c9d0] transition-colors ${
              tab === t
                ? "bg-white text-[#1a1d23] border-b-2 border-b-[#1a2b4a] -mb-px"
                : "text-[#6b7280] hover:text-[#374151] hover:bg-[#e5e7eb]"
            }`}
          >
            {t === "notas" ? "NOTAS" : t === "asistencia" ? "ASISTENCIA" : "ANOTACIONES"}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto bg-white">
        {!cursoId ? (
          <EmptyState colegio={colegioSel} />
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
    </div>
  );
}

/* ================================================================
   Empty State — muestra info útil cuando no hay curso seleccionado
   ================================================================ */
function EmptyState({ colegio }: { colegio?: Colegio }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-[#6b7280]">
      <div className="text-center max-w-md">
        <div className="text-4xl mb-3">📚</div>
        <h2 className="text-sm font-bold text-[#1a1d23] mb-1">Libro de Clases Digital</h2>
        <p className="text-[11px] leading-relaxed mb-4">
          Selecciona un <strong>curso</strong> desde los selectores superiores para visualizar notas, asistencia y anotaciones.
        </p>
        {colegio && (
          <div className="text-[10px] text-[#9ca3af] border-t border-[#e5e7eb] pt-3 mt-3">
            Colegio activo: <strong className="text-[#6b7280]">{colegio.nombre}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   Tab Notas
   ================================================================ */

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

  const notaPorCelda = useMemo(() => {
    const m = new Map<string, Calificacion>();
    for (const n of notas) {
      m.set(`${n.estudiante_id}|${n.asignatura_id}|${n.descripcion}|${n.fecha}`, n);
    }
    return m;
  }, [notas]);

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
    return <div className="p-8 text-center text-[11px] text-[#9ca3af]">Selecciona un período de evaluación.</div>;
  }

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-2">
        <div className="text-[10px] text-[#6b7280]">
          {cursoLabel} · {periodoLabel} · {estudiantes.length} estudiantes · {columnas.length} evaluaciones
        </div>
        <button
          onClick={() => setEvalForm({
            asignatura_id: carga[0]?.asignatura_id || "",
            descripcion: "",
            fecha: today(),
            tipo: "coef_1",
            ponderacion: 100,
            notas: Object.fromEntries(estudiantes.map((e) => [e.id, ""])),
          })}
          className="bg-[#1a2b4a] text-white px-3 py-1 text-[11px] font-semibold hover:bg-[#2a3b5a]"
        >
          + NUEVA EVALUACIÓN
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
        <p className="text-[#9ca3af] italic text-[11px] py-8 text-center">Este curso no tiene estudiantes matriculados.</p>
      ) : (
        <div className="overflow-x-auto border border-[#c5c9d0]">
          <table className="text-[11px] border-collapse w-full">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="px-2 py-1 text-left font-semibold text-[#374151] sticky left-0 bg-[#f3f4f6] z-10 border border-[#c5c9d0] min-w-[140px]">
                  Estudiante
                </th>
                {columnas.map((col) => (
                  <th key={`${col.asignatura_id}|${col.descripcion}|${col.fecha}`} className="px-1 py-1 text-center border border-[#c5c9d0] text-[10px] font-semibold text-[#374151] min-w-[70px]" title={`${col.asignatura_codigo} · ${col.descripcion}`}>
                    <div className="text-[9px] font-bold text-[#1a2b4a]">{col.asignatura_codigo}</div>
                    <div className="text-[9px] text-[#6b7280] max-w-[90px] truncate">{col.descripcion}</div>
                    <div className="text-[8px] text-[#9ca3af]">{col.fecha}</div>
                  </th>
                ))}
                {asignaturasUnicas.map((a) => (
                  <th key={`prom-${a.id}`} className="px-1 py-1 text-center border border-[#c5c9d0] bg-[#f3f4f6] text-[10px] font-bold text-[#374151] min-w-[55px]">
                    PROM {a.codigo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((est) => (
                <tr key={est.id} className="hover:bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <td className="px-2 py-1 sticky left-0 bg-white z-10 border border-[#c5c9d0]">
                    <div className="text-[#1a1d23] font-medium text-[11px]">{est.apellido_paterno}, {est.nombres.split(" ")[0]}</div>
                    <div className="text-[8px] text-[#9ca3af] font-mono">{est.rut}</div>
                  </td>
                  {columnas.map((col) => {
                    const cal = notaPorCelda.get(`${est.id}|${col.asignatura_id}|${col.descripcion}|${col.fecha}`);
                    return (
                      <td
                        key={`${est.id}|${col.asignatura_id}|${col.descripcion}|${col.fecha}`}
                        className="px-0.5 py-0.5 text-center border border-[#e5e7eb] cursor-pointer hover:bg-[#eff6ff] min-w-[50px]"
                        onClick={() => cal && editarNotaInline(cal, cargar)}
                      >
                        {cal?.nota
                          ? <span className={`font-mono font-semibold text-[11px] ${parseFloat(cal.nota) < 4 ? "text-[#991b1b] bg-[#fef2f2]" : "text-[#1a1d23]"}`}>
                              {parseFloat(cal.nota).toFixed(1)}
                            </span>
                          : <span className="text-[#d1d5db]">—</span>}
                      </td>
                    );
                  })}
                  {asignaturasUnicas.map((a) => {
                    const p = promediosPorAsignatura.get(`${est.id}|${a.id}`);
                    return (
                      <td key={`prom-${est.id}-${a.id}`} className="px-1 py-1 text-center border border-[#c5c9d0] bg-[#f9fafb]">
                        {p != null
                          ? <span className={`font-mono font-bold text-[11px] ${p < 4 ? "text-[#991b1b]" : "text-[#047857]"}`}>{p.toFixed(1)}</span>
                          : <span className="text-[#d1d5db]">—</span>}
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

/* ================================================================
   Sub-form: Nueva evaluación (bulk)
   ================================================================ */

type EvalFormState = {
  asignatura_id: string;
  descripcion: string;
  fecha: string;
  tipo: string;
  ponderacion: number;
  notas: Record<string, string>;
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
    <div className="bg-white border border-[#c5c9d0] p-3 space-y-3 mb-3">
      <h3 className="font-semibold text-[#1a1d23] text-[11px] uppercase tracking-wide">Nueva Evaluación</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
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
        <div className="text-[10px] font-semibold text-[#374151] mb-1">Notas de los estudiantes (vacío = pendiente)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
          {estudiantes.map((e) => (
            <div key={e.id} className="flex items-center gap-1 text-[11px]">
              <span className="flex-1 truncate text-[#374151]">{e.apellido_paterno}, {e.nombres.split(" ")[0]}</span>
              <input
                type="text"
                inputMode="decimal"
                value={form.notas[e.id] || ""}
                onChange={(ev) => setForm({ ...form, notas: { ...form.notas, [e.id]: ev.target.value } })}
                placeholder="-"
                className="w-12 text-center font-mono border border-[#c5c9d0] px-1 py-0.5 text-[11px]"
              />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-[#991b1b] text-[11px]">{error}</p>}
      <div className="flex gap-2">
        <button onClick={guardar} className="bg-[#1a2b4a] text-white px-3 py-1 text-[11px] font-semibold hover:bg-[#2a3b5a]">
          GUARDAR EVALUACIÓN
        </button>
        <button onClick={onCancel} className="px-3 py-1 text-[11px] border border-[#c5c9d0] hover:bg-[#f3f4f6]">CANCELAR</button>
      </div>
    </div>
  );
}

/* ================================================================
   Tab Asistencia
   ================================================================ */

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

  const marcarTodosPresentes = () => {
    const r = { ...registros };
    for (const e of estudiantes) r[e.id] = "presente";
    setRegistros(r);
  };

  return (
    <div className="p-2">
      <div className="flex flex-wrap gap-2 items-end mb-2">
        <Field label="Fecha">
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={input} />
        </Field>
        <button onClick={marcarTodosPresentes} className="text-[11px] px-2 py-1 border border-[#c5c9d0] hover:bg-[#f3f4f6]">
          MARCAR TODOS PRESENTES
        </button>
        <button onClick={guardar} disabled={guardando} className="bg-[#1a2b4a] text-white px-3 py-1 text-[11px] font-semibold hover:bg-[#2a3b5a] disabled:opacity-50">
          {guardando ? "GUARDANDO…" : "GUARDAR ASISTENCIA"}
        </button>
        {msg && <span className="text-[11px] text-[#6b7280]">{msg}</span>}
      </div>

      {estudiantes.length === 0 ? (
        <p className="text-[#9ca3af] italic text-[11px] py-8 text-center">Sin estudiantes matriculados.</p>
      ) : (
        <div className="overflow-x-auto border border-[#c5c9d0]">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="px-2 py-1 text-left text-[10px] font-semibold text-[#374151] border border-[#c5c9d0]">N°</th>
                <th className="px-2 py-1 text-left text-[10px] font-semibold text-[#374151] border border-[#c5c9d0]">Estudiante</th>
                <th className="px-2 py-1 text-center text-[10px] font-semibold text-[#374151] border border-[#c5c9d0]">Estado</th>
                <th className="px-2 py-1 text-left text-[10px] font-semibold text-[#374151] border border-[#c5c9d0]">Observación</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((e, idx) => {
                const sel = registros[e.id];
                return (
                  <tr key={e.id} className="border-b border-[#e5e7eb] hover:bg-[#f9fafb]">
                    <td className="px-2 py-1 text-[#6b7280] text-[10px] border border-[#e5e7eb]">{idx + 1}</td>
                    <td className="px-2 py-1 border border-[#e5e7eb]">
                      <div className="font-medium text-[#1a1d23] text-[11px]">{e.apellido_paterno} {e.apellido_materno || ""}, {e.nombres}</div>
                      <div className="text-[8px] text-[#9ca3af] font-mono">{e.rut}</div>
                    </td>
                    <td className="px-2 py-1 border border-[#e5e7eb]">
                      <div className="flex justify-center gap-0.5">
                        {ESTADOS.map((est) => (
                          <button
                            key={est}
                            onClick={() => setEstado(e.id, est)}
                            title={ESTADO_ASISTENCIA_LABELS[est]}
                            className={`w-6 h-6 text-[9px] font-bold transition-all border ${
                              sel === est
                                ? ESTADO_ASISTENCIA_COLOR[est] + " border-transparent"
                                : "bg-white text-[#9ca3af] border-[#c5c9d0] hover:bg-[#f3f4f6]"
                            }`}
                          >
                            {ESTADO_ASISTENCIA_LETRA[est]}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-1 border border-[#e5e7eb]">
                      <input
                        type="text"
                        value={observaciones[e.id] || ""}
                        onChange={(ev) => setObservaciones({ ...observaciones, [e.id]: ev.target.value })}
                        placeholder="Opcional…"
                        className="w-full text-[11px] border border-[#e5e7eb] px-1 py-0.5"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-[10px] text-[#6b7280] flex gap-3 flex-wrap mt-2">
        {ESTADOS.map((est) => (
          <span key={est}><strong>{ESTADO_ASISTENCIA_LETRA[est]}</strong> = {ESTADO_ASISTENCIA_LABELS[est]}</span>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   Tab Anotaciones
   ================================================================ */

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
    <div className="p-2">
      <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2">
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="border border-[#c5c9d0] px-2 py-1 text-[11px] bg-white">
            <option value="">Todas las anotaciones</option>
            {TIPOS_ANOT.map((t) => <option key={t} value={t}>{TIPO_ANOTACION_LABELS[t]}</option>)}
          </select>
        </div>
        <button
          onClick={form ? () => setForm(null) : abrirNuevo}
          className="bg-[#1a2b4a] text-white px-3 py-1 text-[11px] font-semibold hover:bg-[#2a3b5a]"
        >
          {form ? "CANCELAR" : "+ NUEVA ANOTACIÓN"}
        </button>
      </div>

      {form && (
        <div className="bg-white border border-[#c5c9d0] p-3 space-y-3 mb-3">
          <h3 className="font-semibold text-[#1a1d23] text-[11px] uppercase tracking-wide">Nueva Anotación</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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
              <div className="flex gap-1">
                {TIPOS_ANOT.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, tipo: t })}
                    className={`flex-1 text-[10px] px-2 py-1 border transition-colors ${
                      form.tipo === t ? TIPO_ANOTACION_COLOR[t] + " font-semibold" : "border-[#c5c9d0] hover:bg-[#f3f4f6]"
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
          {error && <p className="text-[#991b1b] text-[11px]">{error}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} className="bg-[#1a2b4a] text-white px-3 py-1 text-[11px] font-semibold hover:bg-[#2a3b5a]">
              GUARDAR ANOTACIÓN
            </button>
            <button onClick={() => setForm(null)} className="px-3 py-1 text-[11px] border border-[#c5c9d0] hover:bg-[#f3f4f6]">CANCELAR</button>
          </div>
        </div>
      )}

      {anotaciones.length === 0 ? (
        <div className="bg-white border border-[#c5c9d0] p-12 text-center text-[#9ca3af] text-[11px]">
          Sin anotaciones en este filtro.
        </div>
      ) : (
        <div className="border border-[#c5c9d0]">
          {anotaciones.map((a, idx) => (
            <div key={a.id} className={`bg-white border-b border-[#e5e7eb] p-2 flex gap-2 ${idx === anotaciones.length - 1 ? 'border-b-0' : ''}`}>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 ${TIPO_ANOTACION_COLOR[a.tipo]}`}>
                    {TIPO_ANOTACION_LABELS[a.tipo]}
                  </span>
                  <span className="font-medium text-[#1a1d23] text-[11px]">{a.estudiante_nombre}</span>
                  {a.asignatura_nombre && <span className="text-[#6b7280] text-[10px]">· {a.asignatura_nombre}</span>}
                  {a.categoria && <span className="text-[9px] px-1.5 py-0.5 bg-[#f3f4f6] text-[#6b7280]">{a.categoria}</span>}
                  <span className="text-[9px] text-[#9ca3af] ml-auto">{a.fecha}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#374151] whitespace-pre-line">{a.descripcion}</p>
                {a.docente_nombre && <p className="text-[9px] text-[#9ca3af] mt-0.5">— {a.docente_nombre}</p>}
              </div>
              <button onClick={() => eliminar(a)} className="text-[#d1d5db] hover:text-[#991b1b] text-[11px] self-start">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Helpers
   ================================================================ */

function Selector({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const selected = options.find((o) => o.id === value);
  return (
    <div ref={ref} className="relative">
      <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider block mb-0.5">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left bg-white border border-[#c5c9d0] px-2 py-1 text-[11px] text-[#1a1d23] hover:border-[#9ca3af] focus:border-[#1a2b4a] focus:outline-none flex items-center justify-between min-w-[180px]"
      >
        <span className={selected ? "" : "text-[#9ca3af] italic"}>{selected?.label || "Seleccionar…"}</span>
        <svg className="w-3 h-3 text-[#9ca3af] ml-2" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5"/></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-0.5 w-full bg-white border border-[#c5c9d0] shadow-md max-h-60 overflow-auto">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full text-left px-2 py-1 text-[11px] hover:bg-[#f3f4f6] ${!value ? "bg-[#f3f4f6] text-[#1a2b4a] font-semibold" : "text-[#9ca3af] italic"}`}
          >
            — {label === "Curso" ? "Todos los cursos" : "Todos"}
          </button>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange(o.id); setOpen(false); }}
              className={`w-full text-left px-2 py-1 text-[11px] hover:bg-[#f3f4f6] ${o.id === value ? "bg-[#f3f4f6] text-[#1a2b4a] font-semibold" : "text-[#374151]"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const input = "w-full border border-[#c5c9d0] px-2 py-1 text-[11px]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[9px] font-bold text-[#6b7280] uppercase tracking-wider block mb-0.5">{label}</span>
      {children}
    </label>
  );
}
