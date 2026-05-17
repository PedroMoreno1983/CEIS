import { useEffect, useState } from "react";
import { ColegiosAPI } from "../api-gestion";
import { PeriodosAPI } from "../api-libro";
import type { Colegio } from "../types-gestion";
import type { Periodo, TipoPeriodo } from "../types-libro";
import { TIPO_PERIODO_LABELS } from "../types-libro";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";

const anoActual = () => new Date().getFullYear();

type FormState = {
  colegio_id: string;
  ano: number;
  tipo: TipoPeriodo;
  numero: number;
  nombre: string;
  fecha_inicio: string;
  fecha_termino: string;
  activo: boolean;
};

const empty = (colegioId = ""): FormState => ({
  colegio_id: colegioId,
  ano: anoActual(),
  tipo: "semestral",
  numero: 1,
  nombre: "",
  fecha_inicio: "",
  fecha_termino: "",
  activo: true,
});

export default function PeriodosPage() {
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [colegioId, setColegioId] = useState<string>("");
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
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
    setPeriodos(await PeriodosAPI.list({ colegio_id: colegioId }));
  };

  const abrirNuevo = () => {
    setEditId(null);
    setError(null);
    setForm(empty(colegioId));
  };

  const abrirEditar = (p: Periodo) => {
    setEditId(p.id);
    setError(null);
    setForm({
      colegio_id: p.colegio_id,
      ano: p.ano,
      tipo: p.tipo,
      numero: p.numero,
      nombre: p.nombre,
      fecha_inicio: p.fecha_inicio,
      fecha_termino: p.fecha_termino,
      activo: p.activo,
    });
  };

  const cerrar = () => { setForm(null); setEditId(null); setError(null); };

  const guardar = async () => {
    if (!form) return;
    if (!form.nombre.trim() || !form.fecha_inicio || !form.fecha_termino) {
      setError("Nombre, fecha inicio y fecha término son obligatorios");
      return;
    }
    if (form.fecha_termino <= form.fecha_inicio) {
      setError("La fecha de término debe ser posterior a la de inicio");
      return;
    }
    try {
      if (editId) {
        const { colegio_id, ...rest } = form;
        await PeriodosAPI.update(editId, rest as any);
      } else {
        await PeriodosAPI.create(form as any);
      }
      cerrar();
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  const eliminar = async (p: Periodo) => {
    if (!confirm(`¿Eliminar el período "${p.nombre}"?\n\nSe perderán todas las notas registradas en él.`)) return;
    await PeriodosAPI.remove(p.id);
    await cargar();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Períodos académicos"
        subtitle="Semestres / trimestres del año escolar."
      >
        <Button onClick={form ? cerrar : abrirNuevo}>
          {form ? "Cancelar" : "+ Nuevo período"}
        </Button>
      </PageHeader>

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
          <h2 className="font-semibold text-slate-900">{editId ? "Editar período" : "Nuevo período"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Nombre *">
              <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="1er Semestre 2026" className={input} />
            </Field>
            <Field label="Año *">
              <input type="number" min={2020} max={2100} value={form.ano} onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })} className={input} />
            </Field>
            <Field label="Tipo">
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoPeriodo })} className={`${input} bg-white`}>
                {Object.entries(TIPO_PERIODO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <Field label="Número *">
              <input type="number" min={1} max={4} value={form.numero} onChange={(e) => setForm({ ...form, numero: Number(e.target.value) })} className={input} />
            </Field>
            <Field label="Fecha inicio *">
              <input type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} className={input} />
            </Field>
            <Field label="Fecha término *">
              <input type="date" value={form.fecha_termino} onChange={(e) => setForm({ ...form, fecha_termino: e.target.value })} className={input} />
            </Field>
            <Field label="Activo">
              <label className="flex items-center gap-2 text-sm pt-2">
                <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                <span>{form.activo ? "Sí" : "No"}</span>
              </label>
            </Field>
          </div>
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} className="bg-ceis-primary text-white px-4 py-2 rounded font-medium hover:bg-blue-800">
              {editId ? "Guardar cambios" : "Crear período"}
            </button>
            <button onClick={cerrar} className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Año</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Activo</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {periodos.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No hay períodos en este colegio.</td></tr>
            )}
            {periodos.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => abrirEditar(p)}>
                <td className="px-4 py-3 font-medium text-slate-900">{p.nombre}</td>
                <td className="px-4 py-3 text-slate-700">{p.ano}</td>
                <td className="px-4 py-3 text-slate-600">{TIPO_PERIODO_LABELS[p.tipo]}</td>
                <td className="px-4 py-3 text-slate-600">{p.numero}</td>
                <td className="px-4 py-3 text-slate-600">{p.fecha_inicio} → {p.fecha_termino}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                    p.activo ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {p.activo ? "Sí" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); eliminar(p); }} className="text-xs px-2 py-1 text-slate-400 hover:text-rose-600">✕</button>
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
