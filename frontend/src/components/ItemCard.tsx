import { useState } from "react";
import type { Item } from "../types";
import { NIVEL_LABELS, TIPO_LABELS } from "../types";
import { ItemsAPI } from "../api";

interface Props {
  item: Item;
  onUpdate: (item: Item) => void;
  onDelete: (id: string) => void;
}

const estadoColor: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-700",
  revision: "bg-amber-100 text-amber-800",
  aprobado: "bg-emerald-100 text-emerald-800",
  rechazado: "bg-rose-100 text-rose-800",
};

export default function ItemCard({ item, onUpdate, onDelete }: Props) {
  const [busy, setBusy] = useState(false);

  const cambiarEstado = async (estado: string) => {
    setBusy(true);
    try {
      const updated = await ItemsAPI.update(item.id, { estado: estado as any });
      onUpdate(updated);
    } finally {
      setBusy(false);
    }
  };

  const eliminar = async () => {
    if (!confirm("¿Eliminar este ítem definitivamente?")) return;
    setBusy(true);
    try {
      await ItemsAPI.remove(item.id);
      onDelete(item.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 text-blue-800">
          {NIVEL_LABELS[item.nivel]}
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
          {TIPO_LABELS[item.tipo]}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${estadoColor[item.estado]}`}>
          {item.estado}
        </span>
        {item.origen === "original" && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800">
            Original CEIS
          </span>
        )}
        {item.origen === "generado" && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
            IA
          </span>
        )}
        {item.dificultad && (
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Dif. {item.dificultad}/5
          </span>
        )}
      </div>

      <p className="text-slate-900 font-medium leading-relaxed mb-3">{item.enunciado}</p>

      {item.imagen_url && (
        <div className="mb-3 border border-slate-200 rounded overflow-hidden bg-slate-50">
          <img
            src={`/uploads/${item.imagen_url}`}
            alt={`Ítem visual${item.pagina_origen ? ` (pág. ${item.pagina_origen})` : ""}`}
            className="w-full max-h-96 object-contain"
            loading="lazy"
          />
        </div>
      )}

      {item.opciones && (
        <ol className="space-y-1 mb-3 text-sm text-slate-700">
          {item.opciones.map((op) => {
            const isCorrect = item.respuesta_correcta === op.clave;
            return (
              <li
                key={op.clave}
                className={`flex gap-2 px-2 py-1 rounded ${
                  isCorrect ? "bg-emerald-50 text-emerald-900 font-medium" : ""
                }`}
              >
                <span className="font-bold w-5">{op.clave}.</span>
                <span>{op.texto}</span>
                {isCorrect && <span className="ml-auto text-xs">✓ correcta</span>}
              </li>
            );
          })}
        </ol>
      )}

      {item.constructo && (
        <p className="text-xs text-slate-500 italic mb-2">
          <span className="font-medium">Mide:</span> {item.constructo}
        </p>
      )}

      {item.justificacion_generacion && (
        <details className="text-xs text-slate-500 mb-2">
          <summary className="cursor-pointer hover:text-slate-700">Justificación IA</summary>
          <p className="mt-1 pl-3 border-l-2 border-slate-200">{item.justificacion_generacion}</p>
          {item.confianza_generacion && (
            <p className="mt-1 pl-3">Confianza: {(item.confianza_generacion * 100).toFixed(0)}%</p>
          )}
        </details>
      )}

      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
        <button
          disabled={busy || item.estado === "aprobado"}
          onClick={() => cambiarEstado("aprobado")}
          className="text-xs px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          Aprobar
        </button>
        <button
          disabled={busy || item.estado === "revision"}
          onClick={() => cambiarEstado("revision")}
          className="text-xs px-3 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          A revisión
        </button>
        <button
          disabled={busy || item.estado === "rechazado"}
          onClick={() => cambiarEstado("rechazado")}
          className="text-xs px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
        >
          Rechazar
        </button>
        <button
          disabled={busy}
          onClick={eliminar}
          className="text-xs px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 ml-auto"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
