import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ColegiosAPI, CursosAPI, EstudiantesAPI } from "../api-gestion";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import SearchBar from "../components/ui/SearchBar";
import Modal from "../components/ui/Modal";
import DataTable from "../components/ui/DataTable";
import type {
  Colegio, Curso, EstadoEstudiante, Estudiante, Genero,
} from "../types-gestion";
import {
  ESTADO_ESTUDIANTE_LABELS, GENERO_LABELS, NIVEL_CURSO_LABELS,
} from "../types-gestion";

type FormState = {
  colegio_id: string;
  rut: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  fecha_nacimiento: string;
  genero: Genero | "";
  direccion: string;
  comuna: string;
  email_personal: string;
  estado: EstadoEstudiante;
  fecha_ingreso: string;
  curso_id: string;
  numero_lista: string;
};

const empty = (colegioId = ""): FormState => ({
  colegio_id: colegioId,
  rut: "",
  nombres: "",
  apellido_paterno: "",
  apellido_materno: "",
  fecha_nacimiento: "",
  genero: "",
  direccion: "",
  comuna: "",
  email_personal: "",
  estado: "activo",
  fecha_ingreso: "",
  curso_id: "",
  numero_lista: "",
});

export default function EstudiantesPage() {
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [colegioId, setColegioId] = useState<string>("");
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<string>("");

  const [form, setForm] = useState<FormState | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [matricularEst, setMatricularEst] = useState<Estudiante | null>(null);
  const [matCursoId, setMatCursoId] = useState<string>("");
  const [matNumero, setMatNumero] = useState<string>("");

  useEffect(() => {
    ColegiosAPI.list().then((cs) => {
      setColegios(cs);
      if (cs.length && !colegioId) setColegioId(cs[0].id);
    });
  }, []);

  useEffect(() => {
    if (colegioId) {
      cargar();
      CursosAPI.list({ colegio_id: colegioId }).then(setCursos);
    }
  }, [colegioId, estado]);

  const cargar = async () => {
    const data = await EstudiantesAPI.list({
      colegio_id: colegioId,
      estado: estado || undefined,
      q: q || undefined,
      limit: 200,
    });
    setEstudiantes(data);
  };

  const abrirNuevo = () => {
    setEditId(null);
    setError(null);
    setForm(empty(colegioId));
  };

  const abrirEditar = (e: Estudiante) => {
    setEditId(e.id);
    setError(null);
    setForm({
      colegio_id: e.colegio_id,
      rut: e.rut,
      nombres: e.nombres,
      apellido_paterno: e.apellido_paterno,
      apellido_materno: e.apellido_materno || "",
      fecha_nacimiento: e.fecha_nacimiento || "",
      genero: e.genero || "",
      direccion: e.direccion || "",
      comuna: e.comuna || "",
      email_personal: e.email_personal || "",
      estado: e.estado,
      fecha_ingreso: e.fecha_ingreso || "",
      curso_id: "",
      numero_lista: "",
    });
  };

  const cerrar = () => { setForm(null); setEditId(null); setError(null); };

  const guardar = async () => {
    if (!form) return;
    if (!form.rut.trim() || !form.nombres.trim() || !form.apellido_paterno.trim()) {
      setError("RUT, nombres y apellido paterno son obligatorios");
      return;
    }
    try {
      const payload: any = {
        ...form,
        genero: form.genero || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        fecha_ingreso: form.fecha_ingreso || null,
        curso_id: form.curso_id || undefined,
        numero_lista: form.numero_lista ? Number(form.numero_lista) : undefined,
      };
      for (const k of Object.keys(payload)) {
        if (payload[k] === "") payload[k] = null;
      }
      if (editId) {
        const { colegio_id, curso_id, numero_lista, ...rest } = payload;
        await EstudiantesAPI.update(editId, rest);
      } else {
        await EstudiantesAPI.create(payload);
      }
      cerrar();
      await cargar();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al guardar");
    }
  };

  const eliminar = async (e: Estudiante) => {
    if (!confirm(`¿Eliminar a ${e.nombres} ${e.apellido_paterno}?\n\nSe perderá todo el histórico de matrículas.`)) return;
    await EstudiantesAPI.remove(e.id);
    await cargar();
  };

  const abrirMatricular = (e: Estudiante) => {
    setMatricularEst(e);
    setMatCursoId(e.curso_actual_id || "");
    setMatNumero("");
  };

  const confirmarMatricula = async () => {
    if (!matricularEst || !matCursoId) return;
    await EstudiantesAPI.matricular({
      estudiante_id: matricularEst.id,
      curso_id: matCursoId,
      numero_lista: matNumero ? Number(matNumero) : undefined,
    });
    setMatricularEst(null);
    await cargar();
  };

  const columns = [
    {
      key: "nombre",
      header: "Estudiante",
      render: (e: Estudiante) => (
        <span className="font-medium text-slate-900">
          {e.apellido_paterno} {e.apellido_materno || ""}, {e.nombres}
        </span>
      ),
    },
    { key: "rut", header: "RUT", render: (e: Estudiante) => <span className="font-mono text-slate-600">{e.rut}</span> },
    {
      key: "curso",
      header: "Curso actual",
      render: (e: Estudiante) =>
        e.curso_actual_label ? (
          <span>{prettyCursoLabel(e.curso_actual_label)}</span>
        ) : (
          <span className="text-slate-400 italic">sin matrícula</span>
        ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (e: Estudiante) => <Badge variant={estadoVariant(e.estado)}>{ESTADO_ESTUDIANTE_LABELS[e.estado]}</Badge>,
    },
    {
      key: "acciones",
      header: "",
      width: "240px",
      render: (e: Estudiante) => (
        <div className="flex items-center gap-2 justify-end">
          <Link
            to={`/estudiantes/${e.id}`}
            className="text-xs px-2 py-1 rounded border border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Ver perfil
          </Link>
          <Button variant="secondary" size="sm" onClick={() => abrirMatricular(e)}>
            Matricular
          </Button>
          <button onClick={() => eliminar(e)} className="text-xs px-2 py-1 text-slate-400 hover:text-rose-600">
            ✕
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estudiantes"
        subtitle="Identidad persistente por RUT. Matrículas activas y histórico longitudinal."
      >
        <Button onClick={form ? cerrar : abrirNuevo} disabled={!colegioId}>
          {form ? "Cancelar" : "+ Nuevo estudiante"}
        </Button>
      </PageHeader>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={colegioId}
            onChange={(e) => setColegioId(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Selecciona colegio —</option>
            {colegios.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_ESTUDIANTE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="flex-1">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Buscar por nombre, apellido o RUT…"
            />
          </div>
          <Button variant="secondary" onClick={cargar}>Buscar</Button>
        </div>
      </Card>

      <Card padding="none">
        <DataTable
          columns={columns}
          rows={estudiantes}
          onRowClick={(e) => abrirEditar(e)}
          empty="No hay estudiantes en este filtro."
        />
      </Card>

      {/* Modal Nuevo/Editar */}
      <Modal
        open={!!form}
        onClose={cerrar}
        title={editId ? "Editar estudiante" : "Nuevo estudiante"}
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="RUT *">
            <input value={form?.rut || ""} onChange={(e) => setForm({ ...form!, rut: e.target.value })} placeholder="25.111.222-3" className={input} />
          </Field>
          <Field label="Nombres *">
            <input value={form?.nombres || ""} onChange={(e) => setForm({ ...form!, nombres: e.target.value })} className={input} />
          </Field>
          <Field label="Estado">
            <select value={form?.estado} onChange={(e) => setForm({ ...form!, estado: e.target.value as EstadoEstudiante })} className={`${input} bg-white`}>
              {Object.entries(ESTADO_ESTUDIANTE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Apellido paterno *">
            <input value={form?.apellido_paterno || ""} onChange={(e) => setForm({ ...form!, apellido_paterno: e.target.value })} className={input} />
          </Field>
          <Field label="Apellido materno">
            <input value={form?.apellido_materno || ""} onChange={(e) => setForm({ ...form!, apellido_materno: e.target.value })} className={input} />
          </Field>
          <Field label="Fecha de nacimiento">
            <input type="date" value={form?.fecha_nacimiento || ""} onChange={(e) => setForm({ ...form!, fecha_nacimiento: e.target.value })} className={input} />
          </Field>
          <Field label="Género">
            <select value={form?.genero || ""} onChange={(e) => setForm({ ...form!, genero: e.target.value as Genero | "" })} className={`${input} bg-white`}>
              <option value="">—</option>
              {Object.entries(GENERO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Dirección">
            <input value={form?.direccion || ""} onChange={(e) => setForm({ ...form!, direccion: e.target.value })} className={input} />
          </Field>
          <Field label="Comuna">
            <input value={form?.comuna || ""} onChange={(e) => setForm({ ...form!, comuna: e.target.value })} className={input} />
          </Field>
          <Field label="Email personal">
            <input type="email" value={form?.email_personal || ""} onChange={(e) => setForm({ ...form!, email_personal: e.target.value })} className={input} />
          </Field>
          <Field label="Fecha de ingreso al colegio">
            <input type="date" value={form?.fecha_ingreso || ""} onChange={(e) => setForm({ ...form!, fecha_ingreso: e.target.value })} className={input} />
          </Field>
          {!editId && (
            <>
              <Field label="Matricular en curso (opcional)">
                <select value={form?.curso_id || ""} onChange={(e) => setForm({ ...form!, curso_id: e.target.value })} className={`${input} bg-white`}>
                  <option value="">— sin matricular —</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {NIVEL_CURSO_LABELS[c.nivel]} {c.letra} · {c.ano}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="N° lista">
                <input
                  type="number" min={1}
                  value={form?.numero_lista || ""}
                  onChange={(e) => setForm({ ...form!, numero_lista: e.target.value })}
                  className={input}
                />
              </Field>
            </>
          )}
        </div>
        {error && <p className="text-rose-600 text-sm mt-3">{error}</p>}
        <div className="flex gap-2 mt-5">
          <Button onClick={guardar}>
            {editId ? "Guardar cambios" : "Crear estudiante"}
          </Button>
          <Button variant="secondary" onClick={cerrar}>Cancelar</Button>
        </div>
      </Modal>

      {/* Modal Matricular */}
      <Modal
        open={!!matricularEst}
        onClose={() => setMatricularEst(null)}
        title={matricularEst ? `Matricular a ${matricularEst.nombres} ${matricularEst.apellido_paterno}` : "Matricular"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Curso *">
            <select value={matCursoId} onChange={(e) => setMatCursoId(e.target.value)} className={`${input} bg-white`}>
              <option value="">— seleccionar curso —</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {NIVEL_CURSO_LABELS[c.nivel]} {c.letra} · {c.ano}
                </option>
              ))}
            </select>
          </Field>
          <Field label="N° lista">
            <input type="number" min={1} value={matNumero} onChange={(e) => setMatNumero(e.target.value)} className={input} />
          </Field>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Si el estudiante ya tiene una matrícula activa el mismo año, será cerrada automáticamente.
        </p>
        <div className="flex gap-2 mt-5">
          <Button onClick={confirmarMatricula} disabled={!matCursoId}>
            Confirmar matrícula
          </Button>
          <Button variant="secondary" onClick={() => setMatricularEst(null)}>
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function prettyCursoLabel(raw: string): string {
  const labels = NIVEL_CURSO_LABELS as Record<string, string>;
  return raw.replace(/^(\w+_\w+)/, (m) => labels[m] || m);
}

function estadoVariant(estado: EstadoEstudiante): string {
  switch (estado) {
    case "activo": return "emerald";
    case "retirado": return "rose";
    case "egresado": return "blue";
    case "congelado": return "amber";
  }
}

const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700 block mb-1">{label}</span>
      {children}
    </label>
  );
}
