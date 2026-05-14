import { useEffect, useState } from "react";
import { ColegiosAPI } from "../api-gestion";
import { AsignaturasAPI } from "../api-libro";
import type { Colegio } from "../types-gestion";
import type { Asignatura } from "../types-libro";

type FormState = {
  colegio_id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  color: string;
};

const empty = (colegioId = ""): FormState => ({
  colegio_id: colegioId,
  codigo: "",
  nombre: "",
  categoria: "",
  color: "#2563eb",
});

export default function AsignaturasPage() {
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [colegioId, setColegioId] = useState<string>("");
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ColegiosAPI.list().then((cs) => {
      setColegios(cs);
      if (cs.length && !colegioId) setColegioId(cs[0].id);
    });
  }, []);

  useEffect(() => {
    if (colegioId) cargar();
  }, [colegioId]);

  const cargar = async () => {
    setAsignaturas(await AsignaturasAPI.list({ colegio_id: colegioId }));
  };

  const abrirNuevo = () => {
    setEditId(null);
    setError(null);
    setForm(empty(colegioId));
  };

  const abrirEditar = (a: Asignatura) => {
    setEditId(a.id);
    setError(null);
    setForm({
      colegio_id: a.colegio_id,
      codigo: a.codigo,
      nombre: a.nombre,
      categoria: a.categoria || "",
      color: a.color || "#2563eb",
    });
  };

  const cerrar = () => { setForm(null); setEditId(null); setError(null); };

  const guardar = async () => {
    if (!form) return;
    if (!form.codigo.trim() || !form.nombre.trim()) {
      setError("Código y nombre son obligatorios");
      return;
    }
    try {
      const payload: any = {
        ...form,
        codigo: form.codigo.trim().toUpperCase(),
        categoria: form.categoria || null,
      };
      if (editId) {
        const { colegio_id, ...rest } = payload;
        await AsignaturasAPI.update(editId, rest);
      } else {
        await AsignaturasAPI.create(payload);
      }
      cerrar();
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  const eliminar = async (a: Asignatura) => {
    if (!confirm(`¿Eliminar la asignatura ${a.codigo} - ${a.nombre}?\n\nSe perderán todas las notas asociadas.`)) return;
    await AsignaturasAPI.remove(a.id);
    await cargar();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asignaturas</h1>
          <p className="text-slate-600 mt-1">Catálogo de asignaturas del colegio para el libro de clases.</p>
        </div>
        <button
          onClick={form ? cerrar : abrirNuevo}
          disabled={!colegioId}
          className="bg-ceis-primary text-white px-4 py-2 rounded-md font-medium hover:bg-blue-800 disabled:opacity-50"
        >
          {form ? "Cancelar" : "+ Nueva asignatura"}
        </button>
      </div>

      <select
        value={colegioId}
        onChange={(e) => setColegioId(e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
      >
        <option value="">— Selecciona colegio —</option>
        {colegios.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select>

      {form && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">{editId ? "Editar asignatura" : "Nueva asignatura"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Código *">
              <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="MAT" className={input} />
            </Field>
            <Field label="Nombre *">
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Matemática" className={input} />
            </Field>
            <Field label="Categoría">
              <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="núcleo / complementaria" className={input} />
            </Field>
            <Field label="Color">
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-9 w-12 rounded border border-slate-300" />
                <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className={`${input} font-mono`} />
              </div>
            </Field>
          </div>
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} className="bg-ceis-primary text-white px-4 py-2 rounded font-medium hover:bg-blue-800">
              {editId ? "Guardar cambios" : "Crear asignatura"}
            </button>
            <button onClick={cerrar} className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3"></th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {asignaturas.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No hay asignaturas en este colegio todavía.</td></tr>
            )}
            {asignaturas.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => abrirEditar(a)}>
                <td className="px-4 py-3">
                  <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: a.color || "#94a3b8" }} />
                </td>
                <td className="px-4 py-3 font-mono font-semibold text-slate-900">{a.codigo}</td>
                <td className="px-4 py-3 text-slate-700">{a.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{a.categoria || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); eliminar(a); }} className="text-xs px-2 py-1 text-slate-400 hover:text-rose-600">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
