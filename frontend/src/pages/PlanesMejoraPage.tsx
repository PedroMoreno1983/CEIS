import { useEffect, useState } from "react";
import { PlanesAPI } from "../api-gestion";
import type { PlanMejora, ObjetivoPlan, SeguimientoPlan } from "../types-gestion";
import { ESTADO_PLAN_LABELS, ESTADO_PLAN_COLORS, PRIORIDAD_OBJETIVO_LABELS, ESTADO_OBJETIVO_LABELS, ESTADO_OBJETIVO_COLORS } from "../types-gestion";

export default function PlanesMejoraPage() {
  const [planes, setPlanes] = useState<PlanMejora[]>([]);
  const [form, setForm] = useState<Partial<PlanMejora> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const [planActivo, setPlanActivo] = useState<string | null>(null);
  const [objetivos, setObjetivos] = useState<ObjetivoPlan[]>([]);
  const [seguimientos, setSeguimientos] = useState<SeguimientoPlan[]>([]);
  const [formObj, setFormObj] = useState<Partial<ObjetivoPlan> | null>(null);
  const [formSeg, setFormSeg] = useState<Partial<SeguimientoPlan> | null>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await PlanesAPI.list();
      setPlanes(data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setError(null);
    setForm({ titulo: "", descripcion: "", estado: "borrador", fecha_inicio: new Date().toISOString().split("T")[0], estudiante_id: "" });
  };

  const guardar = async () => {
    if (!form?.titulo?.trim() || !form?.estudiante_id?.trim()) {
      setError("Título y estudiante son obligatorios");
      return;
    }
    try {
      if (form.id) await PlanesAPI.update(form.id, form);
      else await PlanesAPI.create(form);
      setForm(null); setError(null); await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  const eliminar = async (p: PlanMejora) => {
    if (!confirm(`¿Eliminar el plan "${p.titulo}"?`)) return;
    await PlanesAPI.remove(p.id);
    if (planActivo === p.id) setPlanActivo(null);
    await cargar();
  };

  const verDetalle = async (planId: string) => {
    setPlanActivo(planId);
    const [obs, segs] = await Promise.all([
      PlanesAPI.objetivos(planId),
      PlanesAPI.seguimientos(planId),
    ]);
    setObjetivos(obs);
    setSeguimientos(segs);
    setFormObj(null);
    setFormSeg(null);
  };

  const guardarObjetivo = async () => {
    if (!formObj?.descripcion?.trim() || !planActivo) return;
    await PlanesAPI.crearObjetivo(planActivo, { ...formObj, plan_id: planActivo });
    setFormObj(null);
    if (planActivo) verDetalle(planActivo);
  };

  const guardarSeguimiento = async () => {
    if (!formSeg?.descripcion?.trim() || !planActivo) return;
    await PlanesAPI.crearSeguimiento(planActivo, { ...formSeg, plan_id: planActivo });
    setFormSeg(null);
    if (planActivo) verDetalle(planActivo);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planes de mejora</h1>
          <p className="text-slate-600 mt-1">Seguimiento individualizado de estudiantes.</p>
        </div>
        <button onClick={() => (form ? setForm(null) : abrirNuevo())}
          className="bg-ceis-primary text-white px-4 py-2 rounded-md font-medium hover:bg-blue-800">
          {form ? "Cancelar" : "+ Nuevo plan"}
        </button>
      </div>

      {form && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">{form.id ? "Editar plan" : "Nuevo plan"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Título *"><input type="text" value={form.titulo || ""} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Estudiante ID *"><input type="text" value={form.estudiante_id || ""} onChange={(e) => setForm({ ...form, estudiante_id: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Estado">
              <select value={form.estado || "borrador"} onChange={(e) => setForm({ ...form, estado: e.target.value as any })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
                {Object.entries(ESTADO_PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Fecha inicio"><input type="date" value={form.fecha_inicio?.split("T")[0] || ""} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Fecha término estim."><input type="date" value={form.fecha_termino_estim?.split("T")[0] || ""} onChange={(e) => setForm({ ...form, fecha_termino_estim: e.target.value || null })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Autor docente ID"><input type="text" value={form.autor_docente_id || ""} onChange={(e) => setForm({ ...form, autor_docente_id: e.target.value || null })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <div className="md:col-span-3">
              <Field label="Descripción"><textarea value={form.descripcion || ""} rows={3} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            </div>
          </div>
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} className="bg-ceis-primary text-white px-4 py-2 rounded font-medium hover:bg-blue-800">Guardar</button>
            <button onClick={() => setForm(null)} className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr className="text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Título</th><th className="px-4 py-3">Estudiante</th>
            <th className="px-4 py-3">Estado</th><th className="px-4 py-3">Objetivos</th><th className="px-4 py-3">Inicio</th><th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Cargando…</td></tr>}
            {!cargando && planes.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay planes.</td></tr>}
            {!cargando && planes.map((p) => (
              <tr key={p.id} className={`hover:bg-slate-50 cursor-pointer ${planActivo === p.id ? "bg-blue-50" : ""}`} onClick={() => verDetalle(p.id)}>
                <td className="px-4 py-3 font-medium text-slate-900">{p.titulo}</td>
                <td className="px-4 py-3 text-slate-600">{p.estudiante_nombre || p.estudiante_id.slice(0, 8)}</td>
                <td className="px-4 py-3"><span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${ESTADO_PLAN_COLORS[p.estado]}`}>{ESTADO_PLAN_LABELS[p.estado]}</span></td>
                <td className="px-4 py-3 text-slate-600">{p.num_objetivos ?? 0}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{p.fecha_inicio}</td>
                <td className="px-4 py-3 text-right"><button onClick={(e) => { e.stopPropagation(); eliminar(p); }} className="text-xs px-2 py-1 text-slate-400 hover:text-rose-600">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {planActivo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900">Objetivos</h3>
              <button onClick={() => setFormObj({ descripcion: "", prioridad: "media", estado: "pendiente" })} className="text-sm bg-ceis-primary text-white px-3 py-1 rounded hover:bg-blue-800">+ Nuevo</button>
            </div>
            {formObj && (
              <div className="mb-4 p-4 bg-slate-50 rounded border border-slate-200 space-y-3">
                <Field label="Descripción *"><input type="text" value={formObj.descripcion || ""} onChange={(e) => setFormObj({ ...formObj, descripcion: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
                <div className="flex gap-3">
                  <Field label="Prioridad">
                    <select value={formObj.prioridad || "media"} onChange={(e) => setFormObj({ ...formObj, prioridad: e.target.value as any })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
                      {Object.entries(PRIORIDAD_OBJETIVO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label="Estado">
                    <select value={formObj.estado || "pendiente"} onChange={(e) => setFormObj({ ...formObj, estado: e.target.value as any })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
                      {Object.entries(ESTADO_OBJETIVO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="flex gap-2">
                  <button onClick={guardarObjetivo} className="bg-ceis-primary text-white px-3 py-1 rounded text-sm hover:bg-blue-800">Guardar</button>
                  <button onClick={() => setFormObj(null)} className="px-3 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50">Cancelar</button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {objetivos.length === 0 && <p className="text-sm text-slate-400">Sin objetivos.</p>}
              {objetivos.map((o) => (
                <div key={o.id} className="p-3 rounded border border-slate-200">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-slate-800">{o.descripcion}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${ESTADO_OBJETIVO_COLORS[o.estado]}`}>{ESTADO_OBJETIVO_LABELS[o.estado]}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Prioridad: {PRIORIDAD_OBJETIVO_LABELS[o.prioridad]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900">Seguimientos</h3>
              <button onClick={() => setFormSeg({ fecha: new Date().toISOString().split("T")[0], descripcion: "" })} className="text-sm bg-ceis-primary text-white px-3 py-1 rounded hover:bg-blue-800">+ Nuevo</button>
            </div>
            {formSeg && (
              <div className="mb-4 p-4 bg-slate-50 rounded border border-slate-200 space-y-3">
                <Field label="Fecha *"><input type="date" value={formSeg.fecha || ""} onChange={(e) => setFormSeg({ ...formSeg, fecha: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
                <Field label="Descripción *"><textarea value={formSeg.descripcion || ""} rows={2} onChange={(e) => setFormSeg({ ...formSeg, descripcion: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
                <div className="flex gap-2">
                  <button onClick={guardarSeguimiento} className="bg-ceis-primary text-white px-3 py-1 rounded text-sm hover:bg-blue-800">Guardar</button>
                  <button onClick={() => setFormSeg(null)} className="px-3 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50">Cancelar</button>
                </div>
              </div>
            )}
            <div className="space-y-3">
              {seguimientos.length === 0 && <p className="text-sm text-slate-400">Sin seguimientos.</p>}
              {seguimientos.map((s) => (
                <div key={s.id} className="p-3 rounded border border-slate-200">
                  <p className="text-xs text-slate-500">{s.fecha} {s.autor_nombre ? `· ${s.autor_nombre}` : ""}</p>
                  <p className="text-sm text-slate-800 mt-1">{s.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700 block mb-1">{label}</span>
      {children}
    </label>
  );
}
