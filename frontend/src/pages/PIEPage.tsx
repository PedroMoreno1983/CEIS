import { useEffect, useState } from "react";
import { PieAPI } from "../api-gestion";
import type { PIEDiagnostico, PIEIntervencion } from "../types-gestion";
import { TIPO_PIE_LABELS, ESTADO_PIE_LABELS, ESTADO_PIE_COLORS } from "../types-gestion";

export default function PIEPage() {
  const [diagnosticos, setDiagnosticos] = useState<PIEDiagnostico[]>([]);
  const [form, setForm] = useState<Partial<PIEDiagnostico> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const [diagActivo, setDiagActivo] = useState<string | null>(null);
  const [intervenciones, setIntervenciones] = useState<PIEIntervencion[]>([]);
  const [formInt, setFormInt] = useState<Partial<PIEIntervencion> | null>(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await PieAPI.diagnosticos();
      setDiagnosticos(data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setError(null);
    setForm({ tipo: "permanente", estado: "activo", diagnostico: "", fecha_diagnostico: new Date().toISOString().split("T")[0], estudiante_id: "" });
  };

  const guardar = async () => {
    if (!form?.diagnostico?.trim() || !form?.estudiante_id?.trim()) {
      setError("Diagnóstico y estudiante son obligatorios");
      return;
    }
    try {
      if (form.id) await PieAPI.updateDiagnostico(form.id, form);
      else await PieAPI.createDiagnostico(form);
      setForm(null); setError(null); await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  const eliminar = async (d: PIEDiagnostico) => {
    if (!confirm(`¿Eliminar el diagnóstico PIE?`)) return;
    await PieAPI.removeDiagnostico(d.id);
    if (diagActivo === d.id) setDiagActivo(null);
    await cargar();
  };

  const verIntervenciones = async (id: string) => {
    setDiagActivo(id);
    const data = await PieAPI.intervenciones(id);
    setIntervenciones(data);
    setFormInt(null);
  };

  const guardarIntervencion = async () => {
    if (!formInt?.descripcion?.trim() || !diagActivo) return;
    await PieAPI.createIntervencion(diagActivo, { ...formInt, diagnostico_id: diagActivo });
    setFormInt(null);
    if (diagActivo) await verIntervenciones(diagActivo);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PIE</h1>
          <p className="text-slate-600 mt-1">Programa de Integración Escolar — diagnósticos e intervenciones.</p>
        </div>
        <button onClick={() => (form ? setForm(null) : abrirNuevo())}
          className="bg-ceis-primary text-white px-4 py-2 rounded-md font-medium hover:bg-blue-800">
          {form ? "Cancelar" : "+ Nuevo diagnóstico"}
        </button>
      </div>

      {form && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">{form.id ? "Editar diagnóstico" : "Nuevo diagnóstico"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Estudiante ID *"><input type="text" value={form.estudiante_id || ""} onChange={(e) => setForm({ ...form, estudiante_id: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Tipo">
              <select value={form.tipo || "permanente"} onChange={(e) => setForm({ ...form, tipo: e.target.value as any })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
                {Object.entries(TIPO_PIE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Estado">
              <select value={form.estado || "activo"} onChange={(e) => setForm({ ...form, estado: e.target.value as any })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
                {Object.entries(ESTADO_PIE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Fecha diagnóstico"><input type="date" value={form.fecha_diagnostico?.split("T")[0] || ""} onChange={(e) => setForm({ ...form, fecha_diagnostico: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Profesional responsable"><input type="text" value={form.profesional_responsable || ""} onChange={(e) => setForm({ ...form, profesional_responsable: e.target.value || null })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Fecha ingreso PIE"><input type="date" value={form.fecha_ingreso_pie?.split("T")[0] || ""} onChange={(e) => setForm({ ...form, fecha_ingreso_pie: e.target.value || null })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <div className="md:col-span-3">
              <Field label="Diagnóstico *"><textarea value={form.diagnostico || ""} rows={3} onChange={(e) => setForm({ ...form, diagnostico: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            </div>
            <div className="md:col-span-3">
              <Field label="Observaciones"><textarea value={form.observaciones || ""} rows={2} onChange={(e) => setForm({ ...form, observaciones: e.target.value || null })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
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
            <th className="px-4 py-3">Estudiante</th><th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Estado</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Interv.</th><th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Cargando…</td></tr>}
            {!cargando && diagnosticos.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay diagnósticos.</td></tr>}
            {!cargando && diagnosticos.map((d) => (
              <tr key={d.id} className={`hover:bg-slate-50 cursor-pointer ${diagActivo === d.id ? "bg-blue-50" : ""}`} onClick={() => verIntervenciones(d.id)}>
                <td className="px-4 py-3 font-medium text-slate-900">{d.estudiante_nombre || d.estudiante_id.slice(0, 8)}</td>
                <td className="px-4 py-3 text-slate-600">{TIPO_PIE_LABELS[d.tipo]}</td>
                <td className="px-4 py-3"><span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${ESTADO_PIE_COLORS[d.estado]}`}>{ESTADO_PIE_LABELS[d.estado]}</span></td>
                <td className="px-4 py-3 text-slate-500 text-xs">{d.fecha_diagnostico}</td>
                <td className="px-4 py-3 text-slate-600">{d.num_intervenciones ?? 0}</td>
                <td className="px-4 py-3 text-right"><button onClick={(e) => { e.stopPropagation(); eliminar(d); }} className="text-xs px-2 py-1 text-slate-400 hover:text-rose-600">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {diagActivo && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900">Intervenciones</h3>
            <button onClick={() => setFormInt({ fecha: new Date().toISOString().split("T")[0], descripcion: "", profesional: "" })} className="text-sm bg-ceis-primary text-white px-3 py-1 rounded hover:bg-blue-800">+ Nueva</button>
          </div>
          {formInt && (
            <div className="mb-4 p-4 bg-slate-50 rounded border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Fecha *"><input type="date" value={formInt.fecha || ""} onChange={(e) => setFormInt({ ...formInt, fecha: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
                <Field label="Profesional *"><input type="text" value={formInt.profesional || ""} onChange={(e) => setFormInt({ ...formInt, profesional: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
                <Field label="Duración (min)"><input type="number" value={formInt.duracion_minutos || ""} onChange={(e) => setFormInt({ ...formInt, duracion_minutos: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
              </div>
              <Field label="Descripción *"><textarea value={formInt.descripcion || ""} rows={2} onChange={(e) => setFormInt({ ...formInt, descripcion: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
              <div className="flex gap-2">
                <button onClick={guardarIntervencion} className="bg-ceis-primary text-white px-3 py-1 rounded text-sm hover:bg-blue-800">Guardar</button>
                <button onClick={() => setFormInt(null)} className="px-3 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50">Cancelar</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {intervenciones.length === 0 && <p className="text-sm text-slate-400">Sin intervenciones.</p>}
            {intervenciones.map((i) => (
              <div key={i.id} className="p-3 rounded border border-slate-200">
                <div className="flex justify-between">
                  <p className="text-xs text-slate-500">{i.fecha} · {i.profesional} {i.duracion_minutos ? `· ${i.duracion_minutos} min` : ""}</p>
                </div>
                <p className="text-sm text-slate-800 mt-1">{i.descripcion}</p>
              </div>
            ))}
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
