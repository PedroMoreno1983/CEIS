import { useEffect, useState } from "react";
import { ColegiosAPI } from "../api-gestion";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import SearchBar from "../components/ui/SearchBar";
import type { Colegio, Dependencia, EstadoPersona } from "../types-gestion";
import { DEPENDENCIA_LABELS } from "../types-gestion";

type FormState = Partial<Colegio>;

const EMPTY: FormState = {
  nombre: "",
  rbd: "",
  razon_social: "",
  rut: "",
  dependencia: undefined,
  direccion: "",
  comuna: "",
  region: "",
  telefono: "",
  email: "",
  sitio_web: "",
  estado: "activo",
};

export default function ColegiosPage() {
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await ColegiosAPI.list({ q: q || undefined });
      setColegios(data);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirNuevo = () => {
    setEditId(null);
    setError(null);
    setForm({ ...EMPTY });
  };

  const abrirEditar = (c: Colegio) => {
    setEditId(c.id);
    setError(null);
    setForm({
      nombre: c.nombre,
      rbd: c.rbd || "",
      razon_social: c.razon_social || "",
      rut: c.rut || "",
      dependencia: c.dependencia || undefined,
      direccion: c.direccion || "",
      comuna: c.comuna || "",
      region: c.region || "",
      telefono: c.telefono || "",
      email: c.email || "",
      sitio_web: c.sitio_web || "",
      estado: c.estado,
    });
  };

  const cerrar = () => {
    setForm(null);
    setEditId(null);
    setError(null);
  };

  const guardar = async () => {
    if (!form?.nombre?.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    try {
      const payload: any = { ...form };
      // Limpiar strings vacíos a null
      for (const k of Object.keys(payload)) {
        if (payload[k] === "") payload[k] = null;
      }
      if (editId) {
        await ColegiosAPI.update(editId, payload);
      } else {
        await ColegiosAPI.create(payload);
      }
      cerrar();
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  const eliminar = async (c: Colegio) => {
    if (!confirm(`¿Eliminar el colegio "${c.nombre}"?\n\nSe borrarán también todos sus cursos, docentes y estudiantes.`)) return;
    await ColegiosAPI.remove(c.id);
    await cargar();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colegios"
        subtitle="Instituciones cliente del ecosistema CEIS."
      >
        <Button onClick={form ? cerrar : abrirNuevo}>
          {form ? "Cancelar" : "+ Nuevo colegio"}
        </Button>
      </PageHeader>

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Buscar por nombre o RBD…"
            />
          </div>
          <Button variant="secondary" onClick={cargar}>Buscar</Button>
        </div>
      </Card>

      {form && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">
            {editId ? "Editar colegio" : "Nuevo colegio"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre *">
              <input
                type="text"
                value={form.nombre || ""}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="RBD (Mineduc)">
              <input
                type="text"
                value={form.rbd || ""}
                onChange={(e) => setForm({ ...form, rbd: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Razón social">
              <input
                type="text"
                value={form.razon_social || ""}
                onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="RUT">
              <input
                type="text"
                value={form.rut || ""}
                onChange={(e) => setForm({ ...form, rut: e.target.value })}
                placeholder="76.123.456-7"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Dependencia">
              <select
                value={form.dependencia || ""}
                onChange={(e) => setForm({ ...form, dependencia: (e.target.value || undefined) as Dependencia | undefined })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">— sin especificar —</option>
                {Object.entries(DEPENDENCIA_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select
                value={form.estado || "activo"}
                onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoPersona })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
            <Field label="Dirección">
              <input
                type="text"
                value={form.direccion || ""}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Comuna">
              <input
                type="text"
                value={form.comuna || ""}
                onChange={(e) => setForm({ ...form, comuna: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Región">
              <input
                type="text"
                value={form.region || ""}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Teléfono">
              <input
                type="text"
                value={form.telefono || ""}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Sitio web">
              <input
                type="text"
                value={form.sitio_web || ""}
                onChange={(e) => setForm({ ...form, sitio_web: e.target.value })}
                placeholder="https://…"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} className="bg-ceis-primary text-white px-4 py-2 rounded font-medium hover:bg-blue-800">
              {editId ? "Guardar cambios" : "Crear colegio"}
            </button>
            <button onClick={cerrar} className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">RBD</th>
              <th className="px-4 py-3">Dependencia</th>
              <th className="px-4 py-3">Comuna</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Cargando…</td></tr>
            )}
            {!cargando && colegios.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay colegios todavía.</td></tr>
            )}
            {!cargando && colegios.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => abrirEditar(c)}>
                <td className="px-4 py-3 font-medium text-slate-900">{c.nombre}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{c.rbd || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c.dependencia ? DEPENDENCIA_LABELS[c.dependencia] : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{c.comuna || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                    c.estado === "activo" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {c.estado === "activo" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); eliminar(c); }}
                    className="text-xs px-2 py-1 text-slate-400 hover:text-rose-600"
                  >
                    ✕
                  </button>
                </td>
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
