import type { ResultadosAplicacion } from "../types";
import { TIPO_LABELS } from "../types";

const TIPOS_LIKERT = new Set([
  "intereses", "personalidad", "adaptacion_motivacion",
  "habitos_estudio", "estrategias_aprendizaje",
]);

interface Props {
  resultados: ResultadosAplicacion;
  modoDocente?: boolean;
}

export default function ResultadosView({ resultados, modoDocente = false }: Props) {
  const r = resultados;
  const esLikert = TIPOS_LIKERT.has(r.instrumento_tipo);

  return (
    <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-br from-ceis-primary to-blue-700 text-white p-8">
        <p className="text-xs uppercase tracking-widest text-blue-200">Resultados</p>
        <h1 className="text-2xl font-bold mt-1">{r.instrumento_nombre}</h1>
        <p className="text-blue-100 mt-1">{TIPO_LABELS[r.instrumento_tipo]}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-blue-400">
          <Stat label="Ítems" value={`${r.items_respondidos} / ${r.total_items}`} />
          {!esLikert && r.porcentaje !== null && (
            <Stat label="Correctas" value={`${r.correctas} (${r.porcentaje}%)`} />
          )}
          <Stat
            label="Tiempo total"
            value={r.tiempo_total_segundos ? formatTiempo(r.tiempo_total_segundos) : "—"}
          />
          {r.estudiante.nombre && <Stat label="Estudiante" value={r.estudiante.nombre} />}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {!esLikert && r.porcentaje !== null && (
          <div>
            <div className="flex justify-between mb-2 text-sm text-slate-600">
              <span>Desempeño global</span>
              <span className="font-medium">{r.porcentaje}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  r.porcentaje >= 70
                    ? "bg-emerald-500"
                    : r.porcentaje >= 40
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
                style={{ width: `${r.porcentaje}%` }}
              />
            </div>
          </div>
        )}

        {r.por_constructo.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Por dimensión / constructo</h2>
            <div className="space-y-2">
              {r.por_constructo.map((c) => {
                const pct =
                  c.total > 0
                    ? Math.round(100 * (c.es_likert ? c.respondidas : c.correctas) / c.total)
                    : 0;
                return (
                  <div key={c.constructo} className="bg-slate-50 rounded p-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{c.constructo}</span>
                      <span className="text-slate-500">
                        {c.es_likert
                          ? `${c.respondidas} / ${c.total} respondidas`
                          : `${c.correctas} / ${c.total} correctas`}
                      </span>
                    </div>
                    <div className="w-full bg-white border border-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 ${c.es_likert ? "bg-blue-500" : pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {modoDocente && r.detalle.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Detalle por ítem</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {r.detalle.map((d, i) => (
                <div
                  key={d.item_id}
                  className={`p-3 rounded text-sm border ${
                    d.correcta === true
                      ? "border-emerald-200 bg-emerald-50"
                      : d.correcta === false
                      ? "border-rose-200 bg-rose-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-500">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-slate-900">{d.enunciado}</p>
                      {d.constructo && <p className="text-xs text-slate-500 italic mt-1">{d.constructo}</p>}
                    </div>
                    <div className="text-right text-xs">
                      <p>
                        Respuesta: <strong>{d.respuesta || "—"}</strong>
                      </p>
                      {d.respuesta_correcta && (
                        <p className="text-slate-500">Correcta: {d.respuesta_correcta}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!modoDocente && (
          <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
            ¡Listo! Puedes cerrar esta ventana.
            <p className="text-xs text-slate-400 mt-1">
              Tus respuestas fueron guardadas correctamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-blue-200">{label}</p>
      <p className="text-base font-semibold mt-0.5 break-words">{value}</p>
    </div>
  );
}

function formatTiempo(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}
