import { useEffect, useState } from "react";
import { ItemsAPI } from "../api";
import type { Item, Nivel, Tipo, Estado, Origen } from "../types";
import { NIVEL_LABELS, TIPO_LABELS } from "../types";
import ItemCard from "../components/ItemCard";

export default function BankPage() {
  const [nivel, setNivel] = useState<Nivel | "">("");
  const [tipo, setTipo] = useState<Tipo | "">("");
  const [estado, setEstado] = useState<Estado | "">("");
  const [origen, setOrigen] = useState<Origen | "">("");
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await ItemsAPI.list({
        nivel: nivel || undefined,
        tipo: tipo || undefined,
        estado: estado || undefined,
        origen: origen || undefined,
        limit: 100,
      });
      setItems(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [nivel, tipo, estado, origen]);

  const onUpdate = (it: Item) => {
    setItems((prev) => prev.map((i) => (i.id === it.id ? it : i)));
  };

  const onDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((t) => t - 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Banco de Ítems</h1>
        <p className="text-slate-600 mt-1">
          {total} ítem{total !== 1 ? "s" : ""} en el banco
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <Select label="Nivel" value={nivel} onChange={(v) => setNivel(v as any)}>
          <option value="">Todos los niveles</option>
          {Object.entries(NIVEL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select label="Tipo" value={tipo} onChange={(v) => setTipo(v as any)}>
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select label="Estado" value={estado} onChange={(v) => setEstado(v as any)}>
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="revision">En revisión</option>
          <option value="aprobado">Aprobado</option>
          <option value="rechazado">Rechazado</option>
        </Select>
        <Select label="Origen" value={origen} onChange={(v) => setOrigen(v as any)}>
          <option value="">Todos los orígenes</option>
          <option value="original">Original CEIS</option>
          <option value="generado">Generado por IA</option>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando ítems...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No hay ítems con estos filtros. Genera nuevos en la pestaña "Generar".
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((it) => (
            <ItemCard key={it.id} item={it} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700 font-medium">{label}</span>
      <select
        className="mt-1 w-full rounded-md border-slate-300 border px-3 py-2 text-sm bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}
