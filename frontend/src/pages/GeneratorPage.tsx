import { useState } from "react";
import { GeneracionAPI } from "../api";
import type { Item, Nivel, Tipo } from "../types";
import { NIVEL_LABELS, TIPO_LABELS, TIPOS_VISUALES } from "../types";
import ItemCard from "../components/ItemCard";

export default function GeneratorPage() {
  const [nivel, setNivel] = useState<Nivel>("5_6_basico");
  const [tipo, setTipo] = useState<Tipo>("razonamiento_verbal");
  const [cantidad, setCantidad] = useState(5);
  const [dificultad, setDificultad] = useState<number | "">("");
  const [constructo, setConstructo] = useState("");
  const [extra, setExtra] = useState("");

  const [generando, setGenerando] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [meta, setMeta] = useState<{ tokens?: number; ms?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const esVisual = (TIPOS_VISUALES as readonly string[]).includes(tipo);
  const VISUALES_DISPONIBLES: string[] = [
    "razonamiento_abstracto", "atencion", "memoria_visual",
    "razonamiento_espacial", "aptitud_espacial",
  ];
  const [modoVisual, setModoVisual] = useState<"procedimental" | "creativo">("procedimental");

  const generar = async () => {
    setGenerando(true);
    setError(null);
    setItems([]);
    setMeta(null);
    try {
      let fn = GeneracionAPI.generar;
      if (esVisual && modoVisual === "procedimental") fn = GeneracionAPI.generarVisual;
      else if (esVisual && modoVisual === "creativo") fn = GeneracionAPI.generarCreativo;
      const cant = (esVisual && modoVisual === "creativo") ? Math.min(cantidad, 5) : cantidad;
      const res = await fn({
        nivel,
        tipo,
        cantidad: cant,
        dificultad_objetivo: dificultad ? Number(dificultad) : undefined,
        constructo: constructo || undefined,
        instrucciones_extra: extra || undefined,
      });
      setItems(res.items_generados);
      setMeta({ tokens: res.tokens_usados, ms: res.duracion_ms });
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Error al generar");
    } finally {
      setGenerando(false);
    }
  };

  const onUpdate = (it: Item) => {
    setItems((prev) => prev.map((i) => (i.id === it.id ? it : i)));
  };
  const onDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Generar Ítems</h1>
        <p className="text-slate-600 mt-1">
          Crea ítems nuevos: <strong>textuales</strong> con IA (Claude) o <strong>visuales</strong> con
          generación procedimental (figuras matemáticas).
        </p>
      </div>

      <div className={`rounded-lg p-3 text-sm ${esVisual ? "bg-purple-50 border border-purple-200 text-purple-900" : "bg-blue-50 border border-blue-200 text-blue-900"}`}>
        {esVisual ? (
          <>
            🎨 <strong>Modo visual:</strong> elige cómo generar las figuras.
            {!VISUALES_DISPONIBLES.includes(tipo) && (
              <p className="mt-1 text-rose-700">
                ⚠ Generador aún no implementado para este tipo. Disponibles: razonamiento abstracto,
                atención, memoria visual, razonamiento espacial.
              </p>
            )}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className={`p-3 border-2 rounded-lg cursor-pointer ${modoVisual === "procedimental" ? "border-purple-600 bg-purple-100" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" checked={modoVisual === "procedimental"} onChange={() => setModoVisual("procedimental")} />
                  <strong>Procedimental</strong>
                  <span className="text-xs text-slate-500">(rápido, gratis)</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">14 plantillas con variaciones de parámetros. Hasta 20 ítems por lote.</p>
              </label>
              <label className={`p-3 border-2 rounded-lg cursor-pointer ${modoVisual === "creativo" ? "border-fuchsia-600 bg-fuchsia-100" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center gap-2">
                  <input type="radio" checked={modoVisual === "creativo"} onChange={() => setModoVisual("creativo")} />
                  <strong>Creativo (Claude)</strong>
                  <span className="text-xs text-slate-500">(consume API, máx 5)</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">Claude diseña la lógica única de cada ítem. Más variedad real.</p>
              </label>
            </div>
          </>
        ) : (
          <>
            ✏️ <strong>Modo textual:</strong> usa el LLM (Claude) para escribir ítems originales
            siguiendo la lógica de las baterías CEIS. Consume tokens de API.
          </>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nivel educativo">
            <select
              className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm bg-white"
              value={nivel}
              onChange={(e) => setNivel(e.target.value as Nivel)}
            >
              {Object.entries(NIVEL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Tipo de ítem">
            <select
              className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm bg-white"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Tipo)}
            >
              {Object.entries(TIPO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Cantidad (1-20)">
            <input
              type="number"
              min={1}
              max={20}
              className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
            />
          </Field>

          <Field label="Dificultad objetivo (opcional, 1-5)">
            <input
              type="number"
              min={1}
              max={5}
              className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm"
              value={dificultad}
              onChange={(e) => setDificultad(e.target.value as any)}
            />
          </Field>
        </div>

        <Field label="Constructo específico (opcional)">
          <input
            type="text"
            placeholder="Ej: Relación de opuestos / Responsabilidad / Interés científico"
            className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm"
            value={constructo}
            onChange={(e) => setConstructo(e.target.value)}
          />
        </Field>

        <Field label="Instrucciones extra (opcional)">
          <textarea
            rows={3}
            placeholder="Cualquier indicación adicional para el LLM"
            className="w-full rounded-md border-slate-300 border px-3 py-2 text-sm"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
        </Field>

        <button
          onClick={generar}
          disabled={generando || (esVisual && !VISUALES_DISPONIBLES.includes(tipo))}
          className={`w-full text-white py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
            esVisual
              ? modoVisual === "creativo"
                ? "bg-fuchsia-700 hover:bg-fuchsia-800"
                : "bg-purple-700 hover:bg-purple-800"
              : "bg-ceis-primary hover:bg-blue-800"
          }`}
        >
          {generando
            ? (esVisual
                ? (modoVisual === "creativo" ? "Claude diseñando ítems..." : "Generando figuras...")
                : "Generando con IA...")
            : `Generar ${esVisual && modoVisual === "creativo" ? Math.min(cantidad, 5) : cantidad} ítem${cantidad !== 1 ? "s" : ""}`}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {meta && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-md text-sm">
          ✓ Generados {items.length} ítems · {meta.tokens} tokens · {meta.ms} ms
        </div>
      )}

      {items.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-slate-900">Ítems generados</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((it) => (
              <ItemCard key={it.id} item={it} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700 font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
