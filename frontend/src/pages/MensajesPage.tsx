import { useEffect, useState } from "react";
import { MensajesAPI } from "../api-gestion";
import type { Mensaje } from "../types-gestion";
import { TIPO_MENSAJE_LABELS } from "../types-gestion";

export default function MensajesPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [form, setForm] = useState<Partial<Mensaje> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await MensajesAPI.list();
      setMensajes(data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setError(null);
    setForm({ asunto: "", contenido: "", tipo: "individual", importante: false, colegio_id: "" });
  };

  const guardar = async () => {
    if (!form?.asunto?.trim() || !form?.contenido?.trim()) {
      setError("Asunto y contenido son obligatorios");
      return;
    }
    try {
      await MensajesAPI.create(form);
      setForm(null); setError(null); await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  const eliminar = async (m: Mensaje) => {
    if (!confirm(`¿Eliminar el mensaje "${m.asunto}"?`)) return;
    await MensajesAPI.remove(m.id);
    await cargar();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mensajes</h1>
          <p className="text-slate-600 mt-1">Comunicación del colegio hacia las familias.</p>
        </div>
        <button onClick={() => (form ? setForm(null) : abrirNuevo())}
          className="bg-ceis-primary text-white px-4 py-2 rounded-md font-medium hover:bg-blue-800">
          {form ? "Cancelar" : "+ Nuevo mensaje"}
        </button>
      </div>

      {form && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Nuevo mensaje</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Asunto *"><input type="text" value={form.asunto || ""}
              onChange={(e) => setForm({ ...form, asunto: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Tipo">
              <select value={form.tipo || "individual"} onChange={(e) => setForm({ ...form, tipo: e.target.value as any })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
                {Object.entries(TIPO_MENSAJE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Colegio ID"><input type="text" value={form.colegio_id || ""}
              onChange={(e) => setForm({ ...form, colegio_id: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Importante">
              <input type="checkbox" checked={form.importante || false} onChange={(e) => setForm({ ...form, importante: e.target.checked })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Contenido *">
                <textarea value={form.contenido || ""} rows={4}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </Field>
            </div>
          </div>
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} className="bg-ceis-primary text-white px-4 py-2 rounded font-medium hover:bg-blue-800">Enviar</button>
            <button onClick={() => setForm(null)} className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr className="text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Asunto</th><th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Importante</th><th className="px-4 py-3">Leídos</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Cargando…</td></tr>}
            {!cargando && mensajes.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay mensajes.</td></tr>}
            {!cargando && mensajes.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{m.asunto}</td>
                <td className="px-4 py-3 text-slate-600">{TIPO_MENSAJE_LABELS[m.tipo]}</td>
                <td className="px-4 py-3">{m.importante ? <span className="text-amber-600 font-medium">Sí</span> : "—"}</td>
                <td className="px-4 py-3 text-slate-600">{m.num_leidos ?? 0} / {m.num_destinatarios ?? 0}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{new Date(m.creado_en).toLocaleString()}</td>
                <td className="px-4 py-3 text-right"><button onClick={() => eliminar(m)} className="text-xs px-2 py-1 text-slate-400 hover:text-rose-600">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
