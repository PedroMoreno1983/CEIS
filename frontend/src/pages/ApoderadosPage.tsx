import { useEffect, useState } from "react";
import { ApoderadosAPI, EstudiantesAPI } from "../api-gestion";
import type { Apoderado, Estudiante } from "../types-gestion";
import { TIPO_APODERADO_LABELS } from "../types-gestion";

export default function ApoderadosPage() {
  const [apoderados, setApoderados] = useState<Apoderado[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<Partial<Apoderado> | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await ApoderadosAPI.list({ q: q || undefined });
      setApoderados(data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => {
    setEditId(null);
    setError(null);
    setForm({ nombres: "", apellido_paterno: "", estado: "activo", colegio_id: "" });
  };

  const abrirEditar = (a: Apoderado) => {
    setEditId(a.id);
    setError(null);
    setForm({ ...a });
  };

  const guardar = async () => {
    if (!form?.nombres?.trim() || !form?.apellido_paterno?.trim()) {
      setError("Nombres y apellido paterno son obligatorios");
      return;
    }
    try {
      const payload: any = { ...form };
      for (const k of Object.keys(payload)) if (payload[k] === "") payload[k] = null;
      if (editId) await ApoderadosAPI.update(editId, payload);
      else await ApoderadosAPI.create(payload);
      setForm(null); setEditId(null); setError(null); await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  const eliminar = async (a: Apoderado) => {
    if (!confirm(`¿Eliminar a ${a.nombres} ${a.apellido_paterno}?`)) return;
    await ApoderadosAPI.remove(a.id);
    await cargar();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Apoderados</h1>
          <p className="text-slate-600 mt-1">Familias y tutores de los estudiantes.</p>
        </div>
        <button onClick={() => (form ? setForm(null) : abrirNuevo())}
          className="bg-ceis-primary text-white px-4 py-2 rounded-md font-medium hover:bg-blue-800">
          {form ? "Cancelar" : "+ Nuevo apoderado"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input type="text" placeholder="Buscar por nombre o RUT…" value={q}
          onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && cargar()}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button onClick={cargar} className="text-sm px-3 py-2 rounded-md border border-slate-300 hover:bg-slate-50">Buscar</button>
      </div>

      {form && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">{editId ? "Editar apoderado" : "Nuevo apoderado"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Nombres *"><input type="text" value={form.nombres || ""}
              onChange={(e) => setForm({ ...form, nombres: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Apellido paterno *"><input type="text" value={form.apellido_paterno || ""}
              onChange={(e) => setForm({ ...form, apellido_paterno: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Apellido materno"><input type="text" value={form.apellido_materno || ""}
              onChange={(e) => setForm({ ...form, apellido_materno: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="RUT"><input type="text" value={form.rut || ""}
              onChange={(e) => setForm({ ...form, rut: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Teléfono"><input type="text" value={form.telefono || ""}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Email"><input type="email" value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Colegio ID"><input type="text" value={form.colegio_id || ""}
              onChange={(e) => setForm({ ...form, colegio_id: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></Field>
            <Field label="Estado">
              <select value={form.estado || "activo"} onChange={(e) => setForm({ ...form, estado: e.target.value as any })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
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
            <th className="px-4 py-3">Nombre</th><th className="px-4 py-3">RUT</th><th className="px-4 py-3">Teléfono</th>
            <th className="px-4 py-3">Email</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Cargando…</td></tr>}
            {!cargando && apoderados.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay apoderados.</td></tr>}
            {!cargando && apoderados.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => abrirEditar(a)}>
                <td className="px-4 py-3 font-medium text-slate-900">{a.nombres} {a.apellido_paterno} {a.apellido_materno || ""}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{a.rut || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{a.telefono || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{a.email || "—"}</td>
                <td className="px-4 py-3"><span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${a.estado === "activo" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{a.estado === "activo" ? "Activo" : "Inactivo"}</span></td>
                <td className="px-4 py-3 text-right"><button onClick={(e) => { e.stopPropagation(); eliminar(a); }} className="text-xs px-2 py-1 text-slate-400 hover:text-rose-600">✕</button></td>
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
