import { Fragment, useEffect, useMemo, useState } from "react";
import { ColegiosAPI, CursosAPI, DocentesAPI } from "../api-gestion";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import type { Colegio, Curso, Docente, Estudiante, NivelCurso } from "../types-gestion";
import { NIVEL_CURSO_LABELS, NIVEL_CURSO_ORDER } from "../types-gestion";

type FormState = {
  colegio_id: string;
  ano: number;
  nivel: NivelCurso | "";
  letra: string;
  profesor_jefe_id: string;
};

const anoActual = () => new Date().getFullYear();

const empty = (colegioId = ""): FormState => ({
  colegio_id: colegioId,
  ano: anoActual(),
  nivel: "",
  letra: "A",
  profesor_jefe_id: "",
});

export default function CursosPage() {
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [colegioId, setColegioId] = useState<string>("");
  const [ano, setAno] = useState<number>(anoActual());
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);

  const [form, setForm] = useState<FormState | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [verCursoId, setVerCursoId] = useState<string | null>(null);
  const [estudiantesDelCurso, setEstudiantesDelCurso] = useState<Estudiante[]>([]);

  useEffect(() => {
    ColegiosAPI.list().then((cs) => {
      setColegios(cs);
      if (cs.length && !colegioId) setColegioId(cs[0].id);
    });
  }, []);

  useEffect(() => {
    if (colegioId) {
      cargar();
      DocentesAPI.list({ colegio_id: colegioId, estado: "activo" }).then(setDocentes);
    }
  }, [colegioId, ano]);

  const cargar = async () => {
    const data = await CursosAPI.list({ colegio_id: colegioId, ano });
    setCursos(data);
  };

  const abrirNuevo = () => {
    setEditId(null);
    setError(null);
    setForm({ ...empty(colegioId), ano });
  };

  const abrirEditar = (c: Curso) => {
    setEditId(c.id);
    setError(null);
    setForm({
      colegio_id: c.colegio_id,
      ano: c.ano,
      nivel: c.nivel,
      letra: c.letra,
      profesor_jefe_id: c.profesor_jefe_id || "",
    });
  };

  const cerrar = () => { setForm(null); setEditId(null); setError(null); };

  const guardar = async () => {
    if (!form) return;
    if (!form.nivel) { setError("Selecciona un nivel"); return; }
    if (!form.letra.trim()) { setError("La letra es obligatoria"); return; }
    try {
      const payload: any = {
        colegio_id: form.colegio_id,
        ano: form.ano,
        nivel: form.nivel,
        letra: form.letra.trim().toUpperCase(),
        profesor_jefe_id: form.profesor_jefe_id || null,
      };
      if (editId) {
        const { colegio_id, ...rest } = payload;
        await CursosAPI.update(editId, rest);
      } else {
        await CursosAPI.create(payload);
      }
      cerrar();
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  const eliminar = async (c: Curso) => {
    if (!confirm(`¿Eliminar el curso ${NIVEL_CURSO_LABELS[c.nivel]} ${c.letra} (${c.ano})?\n\nSe desmatricularán los estudiantes.`)) return;
    await CursosAPI.remove(c.id);
    await cargar();
  };

  const verEstudiantes = async (c: Curso) => {
    if (verCursoId === c.id) {
      setVerCursoId(null);
      setEstudiantesDelCurso([]);
      return;
    }
    const data = await CursosAPI.estudiantes(c.id);
    setEstudiantesDelCurso(data);
    setVerCursoId(c.id);
  };

  const anosDisponibles = useMemo(() => {
    const actual = anoActual();
    return [actual - 1, actual, actual + 1];
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cursos"
        subtitle="Cursos por año, nivel y letra. Profesor jefe y nómina de estudiantes."
      >
        <Button onClick={form ? cerrar : abrirNuevo} disabled={!colegioId}>
          {form ? "Cancelar" : "+ Nuevo curso"}
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
          <select
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {anosDisponibles.map((a) => <option key={a} value={a}>Año {a}</option>)}
          </select>
        </div>
      </Card>

      {form && (
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4">{editId ? "Editar curso" : "Nuevo curso"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Año *">
              <input
                type="number"
                min={2020} max={2100}
                value={form.ano}
                onChange={(e) => setForm({ ...form, ano: Number(e.target.value) })}
                className={input}
              />
            </Field>
            <Field label="Nivel *">
              <select
                value={form.nivel}
                onChange={(e) => setForm({ ...form, nivel: e.target.value as NivelCurso | "" })}
                className={`${input} bg-white`}
              >
                <option value="">—</option>
                {NIVEL_CURSO_ORDER.map((n) => (
                  <option key={n} value={n}>{NIVEL_CURSO_LABELS[n]}</option>
                ))}
              </select>
            </Field>
            <Field label="Letra *">
              <input
                value={form.letra}
                onChange={(e) => setForm({ ...form, letra: e.target.value.toUpperCase().slice(0, 4) })}
                className={input}
              />
            </Field>
            <Field label="Profesor jefe">
              <select
                value={form.profesor_jefe_id}
                onChange={(e) => setForm({ ...form, profesor_jefe_id: e.target.value })}
                className={`${input} bg-white`}
              >
                <option value="">— Sin asignar —</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.apellido_paterno}, {d.nombres}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {error && <p className="text-rose-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={guardar} className="bg-ceis-primary text-white px-4 py-2 rounded font-medium hover:bg-blue-800">
              {editId ? "Guardar cambios" : "Crear curso"}
            </button>
            <button onClick={cerrar} className="px-4 py-2 rounded border border-slate-300 hover:bg-slate-50">
              Cancelar
            </button>
          </div>
        </Card>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Curso</th>
              <th className="px-4 py-3">Profesor jefe</th>
              <th className="px-4 py-3 text-right">Estudiantes</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cursos.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No hay cursos en este filtro.</td></tr>
            )}
            {cursos.map((c) => (
              <Fragment key={c.id}>
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 cursor-pointer" onClick={() => abrirEditar(c)}>
                    {NIVEL_CURSO_LABELS[c.nivel]} {c.letra} <span className="text-slate-400 font-normal">· {c.ano}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.profesor_jefe_nombre || <span className="text-slate-400 italic">Sin asignar</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{c.num_estudiantes ?? 0}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => verEstudiantes(c)}
                      className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-100"
                    >
                      {verCursoId === c.id ? "Ocultar nómina" : "Ver nómina"}
                    </button>
                    <button onClick={() => eliminar(c)} className="text-xs px-2 py-1 text-slate-400 hover:text-rose-600">✕</button>
                  </td>
                </tr>
                {verCursoId === c.id && (
                  <tr>
                    <td colSpan={4} className="bg-slate-50 px-6 py-4">
                      <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                        Nómina · {estudiantesDelCurso.length} estudiantes
                      </div>
                      {estudiantesDelCurso.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Sin estudiantes matriculados.</p>
                      ) : (
                        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                          {estudiantesDelCurso.map((e) => (
                            <li key={e.id}>
                              {e.apellido_paterno} {e.apellido_materno || ""}, {e.nombres}
                              <span className="text-slate-400 font-mono ml-2">{e.rut}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
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
