import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ApoderadosAPI, EstudiantesAPI, PlanesAPI, PieAPI,
} from "../api-gestion";
import {
  AnotacionesAPI, AsistenciaAPI, CalificacionesAPI, CitacionesAPI,
} from "../api-libro";
import type { Estudiante } from "../types-gestion";
import type { Apoderado, PlanMejora, PIEDiagnostico } from "../types-gestion";
import type { Anotacion, AsistenciaResumen, Calificacion, Citacion } from "../types-libro";
import { ESTADO_CITACION_LABELS, ESTADO_CITACION_COLOR } from "../types-libro";
import {
  ESTADO_PLAN_LABELS, ESTADO_PLAN_COLORS,
  ESTADO_PIE_LABELS, ESTADO_PIE_COLORS,
  GENERO_LABELS, ESTADO_ESTUDIANTE_LABELS,
} from "../types-gestion";
import {
  ESTADO_ASISTENCIA_LABELS, TIPO_ANOTACION_LABELS, TIPO_ANOTACION_COLOR,
} from "../types-libro";

export default function EstudiantePerfilPage() {
  const { id } = useParams<{ id: string }>();
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [apoderados, setApoderados] = useState<any[]>([]);
  const [resumenAsistencia, setResumenAsistencia] = useState<AsistenciaResumen | null>(null);
  const [notas, setNotas] = useState<Calificacion[]>([]);
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>([]);
  const [planes, setPlanes] = useState<PlanMejora[]>([]);
  const [pie, setPie] = useState<PIEDiagnostico[]>([]);
  const [citaciones, setCitaciones] = useState<Citacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    Promise.all([
      EstudiantesAPI.get(id),
      ApoderadosAPI.deEstudiante(id),
      AsistenciaAPI.resumen(id),
      CalificacionesAPI.list({ estudiante_id: id }),
      AnotacionesAPI.list({ estudiante_id: id }),
      PlanesAPI.list({ estudiante_id: id }),
      PieAPI.diagnosticos({ estudiante_id: id }),
      CitacionesAPI.list({ estudiante_id: id }),
    ]).then(([est, apos, asist, not, anot, pls, pds, cits]) => {
      setEstudiante(est);
      setApoderados(apos);
      setResumenAsistencia(asist);
      setNotas(not);
      setAnotaciones(anot);
      setPlanes(pls);
      setPie(pds);
      setCitaciones(cits);
      setCargando(false);
    });
  }, [id]);

  if (cargando) {
    return <div className="text-center py-20 text-slate-400">Cargando perfil…</div>;
  }
  if (!estudiante) {
    return <div className="text-center py-20 text-slate-400">Estudiante no encontrado.</div>;
  }

  const promedioGeneral = calcularPromedioGeneral(notas);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {estudiante.nombres} {estudiante.apellido_paterno} {estudiante.apellido_materno || ""}
            </h1>
            <p className="text-slate-600 mt-1">
              RUT {estudiante.rut} · {GENERO_LABELS[estudiante.genero || "sin_informar"]} · {calcularEdad(estudiante.fecha_nacimiento)} años
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge label={estudiante.curso_actual_label || "Sin curso"} color="blue" />
              <Badge label={ESTADO_ESTUDIANTE_LABELS[estudiante.estado]} color={estudiante.estado === "activo" ? "green" : "slate"} />
              {promedioGeneral !== null && (
                <Badge label={`Prom. general ${promedioGeneral.toFixed(1)}`} color={promedioGeneral < 4 ? "red" : "green"} />
              )}
              {resumenAsistencia && resumenAsistencia.porcentaje_asistencia !== null && (
                <Badge label={`Asist. ${resumenAsistencia.porcentaje_asistencia}%`} color={resumenAsistencia.porcentaje_asistencia < 70 ? "red" : "green"} />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Datos + Apoderados + Planes + PIE */}
        <div className="space-y-6">
          <Section title="Datos personales">
            <dl className="text-sm space-y-2">
              <Dato label="Nombres" value={estudiante.nombres} />
              <Dato label="Apellidos" value={`${estudiante.apellido_paterno} ${estudiante.apellido_materno || ""}`} />
              <Dato label="RUT" value={estudiante.rut} />
              <Dato label="Fecha nacimiento" value={estudiante.fecha_nacimiento || "—"} />
              <Dato label="Género" value={GENERO_LABELS[estudiante.genero || "sin_informar"]} />
              <Dato label="Dirección" value={estudiante.direccion || "—"} />
              <Dato label="Comuna" value={estudiante.comuna || "—"} />
              <Dato label="Email" value={estudiante.email_personal || "—"} />
              <Dato label="Fecha ingreso" value={estudiante.fecha_ingreso || "—"} />
              {estudiante.observaciones && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Observaciones</span>
                  <p className="text-slate-700 mt-1">{estudiante.observaciones}</p>
                </div>
              )}
            </dl>
          </Section>

          <Section title={`Apoderados (${apoderados.length})`}>
            {apoderados.length === 0 ? (
              <p className="text-sm text-slate-400">Sin apoderados registrados.</p>
            ) : (
              <div className="space-y-3">
                {apoderados.map((a: any) => (
                  <div key={a.id} className="text-sm">
                    <div className="font-medium text-slate-800">{a.nombres} {a.apellido_paterno} {a.apellido_materno || ""}</div>
                    <div className="text-slate-500 text-xs">{a.rut || "—"} · {a.telefono || "—"} · {a.email || "—"}</div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title={`Planes de mejora (${planes.length})`}>
            {planes.length === 0 ? (
              <p className="text-sm text-slate-400">Sin planes activos.</p>
            ) : (
              <div className="space-y-2">
                {planes.map((p) => (
                  <div key={p.id} className="p-3 rounded border border-slate-200">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-slate-800">{p.titulo}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${ESTADO_PLAN_COLORS[p.estado]}`}>{ESTADO_PLAN_LABELS[p.estado]}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{p.descripcion || "Sin descripción"}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title={`PIE (${pie.length})`}>
            {pie.length === 0 ? (
              <p className="text-sm text-slate-400">Sin diagnósticos PIE.</p>
            ) : (
              <div className="space-y-2">
                {pie.map((d) => (
                  <div key={d.id} className="p-3 rounded border border-slate-200">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-slate-800">{d.diagnostico.slice(0, 60)}{d.diagnostico.length > 60 ? "…" : ""}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${ESTADO_PIE_COLORS[d.estado]}`}>{ESTADO_PIE_LABELS[d.estado]}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{d.profesional_responsable || "Sin profesional asignado"}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title={`Citaciones (${citaciones.length})`}>
            {citaciones.length === 0 ? (
              <p className="text-sm text-slate-400">Sin citaciones registradas.</p>
            ) : (
              <div className="space-y-2">
                {citaciones.map((c) => (
                  <div key={c.id} className="p-3 rounded border border-slate-200">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-slate-800">{c.motivo.slice(0, 60)}{c.motivo.length > 60 ? "…" : ""}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${ESTADO_CITACION_COLOR[c.estado]}`}>{ESTADO_CITACION_LABELS[c.estado]}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {c.fecha_citacion} {c.hora ? `· ${c.hora}` : ""} {c.lugar ? `· ${c.lugar}` : ""}
                    </p>
                    {c.apoderado_nombre && <p className="text-xs text-slate-400">Apoderado: {c.apoderado_nombre}</p>}
                    {c.resultado && <p className="text-xs text-slate-600 mt-1">Resultado: {c.resultado}</p>}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Columna central: Notas */}
        <div className="lg:col-span-2 space-y-6">
          <Section title={`Calificaciones (${notas.length})`}>
            {notas.length === 0 ? (
              <p className="text-sm text-slate-400">Sin calificaciones registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2">Asignatura</th>
                    <th className="px-3 py-2">Evaluación</th>
                    <th className="px-3 py-2 text-center">Nota</th>
                    <th className="px-3 py-2 text-center">Pond.</th>
                    <th className="px-3 py-2">Fecha</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {notas.map((n) => (
                      <tr key={n.id}>
                        <td className="px-3 py-2 text-slate-700">{n.asignatura_codigo || "—"}</td>
                        <td className="px-3 py-2 text-slate-700">{n.descripcion}</td>
                        <td className="px-3 py-2 text-center font-mono font-semibold">
                          {n.nota != null ? (
                            <span className={parseFloat(n.nota) < 4 ? "text-rose-600" : "text-emerald-700"}>
                              {parseFloat(n.nota).toFixed(1)}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-500">{n.ponderacion}%</td>
                        <td className="px-3 py-2 text-slate-500 text-xs">{n.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title={`Anotaciones (${anotaciones.length})`}>
            {anotaciones.length === 0 ? (
              <p className="text-sm text-slate-400">Sin anotaciones.</p>
            ) : (
              <div className="space-y-2">
                {anotaciones.map((a) => (
                  <div key={a.id} className={`p-3 rounded border-l-4 ${TIPO_ANOTACION_COLOR[a.tipo].replace("bg-", "border-").split(" ")[0]} border-y border-r border-slate-200`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${TIPO_ANOTACION_COLOR[a.tipo]}`}>{TIPO_ANOTACION_LABELS[a.tipo]}</span>
                      <span className="text-xs text-slate-400">{a.fecha}</span>
                      {a.categoria && <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{a.categoria}</span>}
                    </div>
                    <p className="text-sm text-slate-700 mt-1">{a.descripcion}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Resumen asistencia">
            {resumenAsistencia ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatBox label="Total días" value={resumenAsistencia.total_dias} />
                <StatBox label="Presentes" value={resumenAsistencia.presentes} color="green" />
                <StatBox label="Ausentes" value={resumenAsistencia.ausentes} color="red" />
                <StatBox label="Justificados" value={resumenAsistencia.justificados} color="blue" />
                <StatBox label="Atrasados" value={resumenAsistencia.atrasados} color="amber" />
                <div className="col-span-2 md:col-span-4 p-4 bg-slate-50 rounded border border-slate-200 text-center">
                  <span className="text-xs text-slate-500">Porcentaje de asistencia</span>
                  <div className={`text-2xl font-bold mt-1 ${(resumenAsistencia.porcentaje_asistencia || 0) < 70 ? "text-rose-600" : "text-emerald-700"}`}>
                    {resumenAsistencia.porcentaje_asistencia?.toFixed(1) ?? "—"}%
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Sin datos de asistencia.</p>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

// ---------- Helpers ----------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: "blue" | "green" | "red" | "slate" | "amber" }) {
  const map: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-rose-100 text-rose-800",
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-800",
  };
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${map[color]}`}>{label}</span>;
}

function StatBox({ label, value, color = "slate" }: { label: string; value: number; color?: "slate" | "green" | "red" | "blue" | "amber" }) {
  const map: Record<string, string> = {
    slate: "text-slate-700",
    green: "text-emerald-700",
    red: "text-rose-700",
    blue: "text-blue-700",
    amber: "text-amber-700",
  };
  return (
    <div className="p-3 bg-slate-50 rounded border border-slate-200 text-center">
      <div className={`text-xl font-bold ${map[color]}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function calcularEdad(fechaNac?: string | null): number | null {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function calcularPromedioGeneral(notas: Calificacion[]): number | null {
  const validas = notas.filter((n) => n.nota != null);
  if (validas.length === 0) return null;
  const suma = validas.reduce((acc, n) => acc + parseFloat(n.nota!) * n.ponderacion, 0);
  const peso = validas.reduce((acc, n) => acc + n.ponderacion, 0);
  return peso > 0 ? suma / peso : null;
}
