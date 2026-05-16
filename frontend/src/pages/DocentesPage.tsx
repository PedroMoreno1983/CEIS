import { useEffect, useState } from "react";
import { ColegiosAPI, DocentesAPI } from "../api-gestion";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import SearchBar from "../components/ui/SearchBar";
import type { Colegio, Docente, EstadoPersona, RolDocente } from "../types-gestion";
import { ROL_DOCENTE_LABELS } from "../types-gestion";

const ROLES_TODOS: RolDocente[] = [
  "docente", "profesor_jefe", "orientador", "ute", "inspector",
  "direccion", "admin_colegio", "psicologo",
];

type FormState = {
  colegio_id: string;
  rut: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  telefono: string;
  roles: RolDocente[];
  estado: EstadoPersona;
};

const empty = (colegioId = ""): FormState => ({
  colegio_id: colegioId,
  rut: "",
  nombres: "",
  apellido_paterno: "",
  apellido_materno: "",
  email: "",
  telefono: "",
  roles: ["docente"],
  estado: "activo",
});

export default function DocentesPage() {
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [colegioId, setColegioId] = useState<string>("");
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [q, setQ] = useState("");
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
    const data = await DocentesAPI.list({ colegio_id: colegioId, q: q || undefined });
    setDocentes(data);
  };

  const abrirNuevo = () => {
    setEditId(null);
    setError(null);
    setForm(empty(colegioId));
  };

  const abrirEditar = (d: Docente) => {
    setEditId(d.id);
    setError(null);
    setForm({
      colegio_id: d.colegio_id,
      rut: d.rut || "",
      nombres: d.nombres,
      apellido_paterno: d.apellido_paterno,
      apellido_materno: d.apellido_materno || "",
      email: d.email || "",
      telefono: d.telefono || "",
      roles: d.roles,
      estado: d.estado,
    });
  };

  const cerrar = () => { setForm(null); setEditId(null); setError(null); };

  const toggleRol = (r: RolDocente) => {
    if (!form) return;
    const ya = form.roles.includes(r);
    setForm({
      ...form,
      roles: ya ? form.roles.filter((x) => x !== r) : [...form.roles, r],
    });
  };

  const guardar = async () => {
    if (!form) return;
    if (!form.nombres.trim() || !form.apellido_paterno.trim()) {
      setError("Nombres y apellido paterno son obligatorios");
      return;
    }
    if (form.roles.length === 0) {
      setError("Selecciona al menos un rol");
      return;
    }
    try {
      const payload: any = { ...form };
      for (const k of Object.keys(payload)) {
        if (payload[k] === "") payload[k] = null;
      }
      if (editId) {
        const { colegio_id, ...rest } = payload;
        await DocentesAPI.update(editId, rest);
      } else {
        await DocentesAPI.create(payload);
      }
      cerrar();
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  const eliminar = async (d: Docente) => {
    if (!confirm(`¿Eliminar a ${d.nombres} ${d.apellido_paterno}?`)) return;
    await DocentesAPI.remove(d.id);
    await cargar();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Docentes y personal"
        subtitle="Equipo del colegio: docentes, jefatura, orientación, dirección."
      >
        <Button onClick={form ? cerrar : abrirNuevo} disabled={!colegioId}>
          {form ? "Cancelar" : "+ Nuevo docente"}
        </Button>
      </PageHeader>

      <Card>
        <div className="flex items-center gap-3">
          <select
            value={colegioId}
            onChange={(e) => setColegioId(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Selecciona colegio —</option>
            {colegios.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <div className="flex-1">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Buscar por nombre o apellido…"
            />
          </div>
          <Button variant="secondary" onClick={cargar}>Buscar</Button>
        </div>
      </Card>

      {form && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">{editId ? "Editar docente" : "Nuevo docente"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombres *">
              <input value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} className={input} />
            </Field>
            <Field label="Apellido paterno *">
              <input value={form.apellido_paterno} onChange={(e) => setForm({ ...form, apellido_paterno: e.target.value })} className={input} />
            </Field>
            <Field label="Apellido materno">
              <input value={form.apellido_materno} onChange={(e) => setForm({ ...form, apellido_materno: e.target.value })} className={input} />
            </Field>
            <Field label="RUT">
              <input value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} placeholder="12.345.678-9" className={input} />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
            </Field>
            <Field label="Teléfono">
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className={input} />
            </Field>
            <Field label="Estado">
              <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoPersona })} className={`${input} bg-white`}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-700 block mb-2">Roles *</span>
            <div className="flex flex-wrap gap-2">
              {ROLES_TODOS.map((r) => {
                const sel = form.roles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRol(r)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      sel
                        ? "bg-ceis-primary text-white border-ceis-primary"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {ROL_DOCENTE_LABELS[r]}
                  </button>
                );
              })}
            </div>
          </div>
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} className="bg-ceis-primary text-white px-4 py-2 rounded font-medium hover:bg-blue-800">
              {editId ? "Guardar cambios" : "Crear docente"}
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
              <th className="px-4 py-3">RUT</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docentes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No hay docentes en este colegio.</td></tr>
            )}
            {docentes.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => abrirEditar(d)}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {d.apellido_paterno} {d.apellido_materno || ""}, {d.nombres}
                </td>
                <td className="px-4 py-3 font-mono text-slate-600">{d.rut || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{d.email || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {d.roles.map((r) => (
                      <span key={r} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ROL_DOCENTE_LABELS[r]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                    d.estado === "activo" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {d.estado === "activo" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); eliminar(d); }} className="text-xs px-2 py-1 text-slate-400 hover:text-rose-600">✕</button>
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
