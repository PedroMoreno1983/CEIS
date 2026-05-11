import { useEffect, useMemo, useState } from "react";
import { InstrumentosAPI, ItemsAPI } from "../api";
import type { InventarioRow } from "../api";
import type { Nivel, Tipo, Instrumento } from "../types";
import { NIVEL_LABELS, TIPO_LABELS } from "../types";

interface Props {
  onCreado: (i: Instrumento) => void;
}

export default function PruebaMixtaForm({ onCreado }: Props) {
  const [inventario, setInventario] = useState<InventarioRow[]>([]);
  const [nivel, setNivel] = useState<Nivel>("5_6_basico");
  const [nombre, setNombre] = useState("");
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [aleatorizar, setAleatorizar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ItemsAPI.inventario().then(setInventario);
  }, []);

  // Tipos disponibles para el nivel seleccionado
  const tiposNivel = useMemo(
    () => inventario.filter((r) => r.nivel === nivel && r.total > 0),
    [inventario, nivel]
  );

  // Sugerencia automática: 5 ítems de cada tipo disponible
  useEffect(() => {
    if (tiposNivel.length > 0) {
      const sugerencia: Record<string, number> = {};
      tiposNivel.forEach((t) => {
        sugerencia[t.tipo] = Math.min(5, t.total);
      });
      setCantidades(sugerencia);
    }
  }, [tiposNivel]);

  useEffect(() => {
    if (!nombre) {
      setNombre(`Evaluación Integral — ${NIVEL_LABELS[nivel]}`);
    }
  }, [nivel]);

  const total = Object.values(cantidades).reduce((s, n) => s + (n || 0), 0);

  const cambiarCantidad = (tipo: string, valor: number) => {
    setCantidades((prev) => ({ ...prev, [tipo]: Math.max(0, valor) }));
  };

  const armar = async () => {
    if (!nombre.trim()) { setError("Define un nombre"); return; }
    const items_por_tipo = Object.fromEntries(
      Object.entries(cantidades).filter(([_, n]) => n > 0)
    );
    if (Object.keys(items_por_tipo).length === 0) {
      setError("Selecciona al menos un tipo con cantidad > 0");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const inst = await InstrumentosAPI.ensamblarMixta({
        nombre, nivel, items_por_tipo, aleatorizar,
      });
      onCreado(inst);
      setNombre("");
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🎯</span>
        <h2 className="font-bold text-slate-900">Prueba mixta</h2>
      </div>
      <p className="text-sm text-slate-600 mb-4">
        Combina ítems de distintos tipos en una sola evaluación integral.
      </p>

      <div className="space-y-3">
        <label className="block text-sm">
          <span className="text-slate-700 font-medium">Nombre</span>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border-slate-300 border px-3 py-2 text-sm"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700 font-medium">Nivel</span>
          <select
            className="mt-1 w-full rounded-lg border-slate-300 border px-3 py-2 text-sm bg-white"
            value={nivel}
            onChange={(e) => setNivel(e.target.value as Nivel)}
          >
            {Object.entries(NIVEL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">
            Ítems por subprueba <span className="text-slate-500 font-normal">(total: {total})</span>
          </p>
          <div className="bg-white rounded-lg border border-slate-200 max-h-72 overflow-y-auto">
            {tiposNivel.map((t) => (
              <div key={t.tipo} className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 last:border-b-0">
                <span className="flex-1 text-sm text-slate-700">
                  {TIPO_LABELS[t.tipo as Tipo]}
                  <span className="text-xs text-slate-400 ml-1">(disponibles: {t.total}{t.con_imagen > 0 ? " 🖼" : ""})</span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={t.total}
                  className="w-20 rounded border-slate-300 border px-2 py-1 text-sm"
                  value={cantidades[t.tipo] ?? 0}
                  onChange={(e) => cambiarCantidad(t.tipo, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={aleatorizar}
            onChange={(e) => setAleatorizar(e.target.checked)}
          />
          Aleatorizar orden (mezclar ítems entre subpruebas)
        </label>

        {error && (
          <p className="text-rose-700 text-sm bg-rose-50 border border-rose-200 px-3 py-2 rounded">{error}</p>
        )}

        <button
          onClick={armar}
          disabled={loading || total === 0}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-3 rounded-lg font-medium shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Armando..." : `Armar prueba mixta (${total} ítems)`}
        </button>
      </div>
    </div>
  );
}
