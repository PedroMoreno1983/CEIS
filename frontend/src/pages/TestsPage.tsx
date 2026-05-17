import { useEffect, useMemo, useState } from "react";
import { InstrumentosAPI, ItemsAPI, AplicacionesAPI } from "../api";
import PageHeader from "../components/ui/PageHeader";
import type { InventarioRow } from "../api";
import type { Instrumento, Nivel, Tipo } from "../types";
import { NIVEL_LABELS, TIPO_LABELS } from "../types";
import TestPreview from "../components/TestPreview";
import PruebaMixtaForm from "../components/PruebaMixtaForm";
import { descargarWord, imprimirPDF } from "../services/export";

export default function TestsPage() {
  const [pruebas, setPruebas] = useState<Instrumento[]>([]);
  const [inventario, setInventario] = useState<InventarioRow[]>([]);
  const [activa, setActiva] = useState<Instrumento | null>(null);
  const [mostrarRespuestas, setMostrarRespuestas] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState<Nivel>("2_medio");
  const [tipo, setTipo] = useState<Tipo>("razonamiento_abstracto");
  const [cantidad, setCantidad] = useState(20);
  const [soloAprobados, setSoloAprobados] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    const [p, inv] = await Promise.all([
      InstrumentosAPI.list(),
      ItemsAPI.inventario(),
    ]);
    setPruebas(p);
    setInventario(inv);
  };
  useEffect(() => { cargar(); }, []);

  const disponibles = useMemo(() => {
    const row = inventario.find((r) => r.nivel === nivel && r.tipo === tipo);
    return row?.total || 0;
  }, [inventario, nivel, tipo]);

  const tiposDisponiblesNivel = useMemo(
    () => new Set(inventario.filter((r) => r.nivel === nivel).map((r) => r.tipo)),
    [inventario, nivel]
  );

  // Sugerir nombre automático
  useEffect(() => {
    if (!nombre) {
      const tlabel = TIPO_LABELS[tipo].split("(")[0].trim();
      const nlabel = NIVEL_LABELS[nivel];
      setNombre(`${tlabel} — ${nlabel}`);
    }
  }, [nivel, tipo]);

  // Ajustar cantidad si excede disponibles
  useEffect(() => {
    if (disponibles > 0 && cantidad > disponibles) {
      setCantidad(Math.min(disponibles, 25));
    }
  }, [disponibles]);

  const ensamblar = async () => {
    if (!nombre.trim()) { setError("Define un nombre para la prueba"); return; }
    setLoading(true);
    setError(null);
    try {
      const inst = await InstrumentosAPI.ensamblarAuto({
        nombre, nivel, tipo, cantidad, solo_aprobados: soloAprobados,
      });
      setActiva(inst);
      await cargar();
      setNombre("");
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Error al ensamblar");
    } finally {
      setLoading(false);
    }
  };

  const abrir = async (id: string) => {
    setActiva(await InstrumentosAPI.get(id));
    setMostrarRespuestas(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta prueba?")) return;
    await InstrumentosAPI.remove(id);
    if (activa?.id === id) setActiva(null);
    await cargar();
  };

  const generarCodigo = async (id: string, adaptativa = false) => {
    const a = await AplicacionesAPI.crear(id, adaptativa ? { es_adaptativa: true } : {});
    const url = `${window.location.origin}/aplicar/${a.codigo}`;
    navigator.clipboard.writeText(url);
    alert(
      `Código generado: ${a.codigo}\n` +
      (adaptativa ? "Modo: ADAPTATIVO (CAT)\n" : "Modo: lineal\n") +
      `\nLink copiado al portapapeles:\n${url}`
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pruebas"
        subtitle="Ensambla pruebas a partir del banco de ítems. Las pruebas pueden imprimirse, exportarse o aplicarse en pantalla."
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 no-print">
        <h2 className="font-semibold text-slate-900 mb-4">Ensamblar nueva prueba</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre de la prueba">
            <input
              type="text"
              className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </Field>
          <Field label={`Cantidad de ítems (disponibles: ${disponibles})`}>
            <input
              type="number"
              min={3}
              max={Math.max(3, disponibles)}
              className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
            />
          </Field>
          <Field label="Nivel">
            <select
              className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm bg-white"
              value={nivel}
              onChange={(e) => setNivel(e.target.value as Nivel)}
            >
              {Object.entries(NIVEL_LABELS).map(([k, v]) => {
                const total = inventario.filter((r) => r.nivel === k).reduce((s, r) => s + r.total, 0);
                return (
                  <option key={k} value={k} disabled={total === 0}>
                    {v} {total > 0 ? `(${total} ítems)` : "(sin ítems)"}
                  </option>
                );
              })}
            </select>
          </Field>
          <Field label="Tipo de prueba">
            <select
              className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm bg-white"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as Tipo)}
            >
              {Object.entries(TIPO_LABELS)
                .sort(([, a], [, b]) => a.localeCompare(b))
                .map(([k, v]) => {
                  const row = inventario.find((r) => r.nivel === nivel && r.tipo === k);
                  const tot = row?.total || 0;
                  const visual = (row?.con_imagen || 0) > 0;
                  return (
                    <option key={k} value={k} disabled={tot === 0}>
                      {v} {tot > 0 ? `· ${tot}${visual ? " 🖼" : ""}` : "(sin ítems)"}
                    </option>
                  );
                })}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 mt-4 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={soloAprobados}
            onChange={(e) => setSoloAprobados(e.target.checked)}
            className="rounded"
          />
          Usar solo ítems con estado <strong>aprobado</strong>
        </label>

        {disponibles === 0 && (
          <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-sm">
            No hay ítems para esta combinación de nivel/tipo.{" "}
            {tiposDisponiblesNivel.size > 0 && (
              <>Para <strong>{NIVEL_LABELS[nivel]}</strong> hay disponibles: {Array.from(tiposDisponiblesNivel).map((t) => TIPO_LABELS[t as Tipo]).join(", ")}.</>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={ensamblar}
          disabled={loading || disponibles === 0}
          className="w-full mt-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 text-white py-3 rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
        >
          {loading ? "Ensamblando..." : "Ensamblar prueba"}
        </button>
      </div>

      <PruebaMixtaForm onCreado={async (inst) => { setActiva(inst); await cargar(); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

      {pruebas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 no-print">
          <h2 className="font-semibold text-slate-900 mb-3">Pruebas guardadas ({pruebas.length})</h2>
          <ul className="divide-y divide-slate-100">
            {pruebas.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                <button
                  onClick={() => abrir(p.id)}
                  className="text-left flex-1 hover:text-blue-700"
                >
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {NIVEL_LABELS[p.nivel]} · {TIPO_LABELS[p.tipo]} · {p.num_items} ítems
                    {" · "}
                    {new Date(p.creado_en).toLocaleDateString()}
                  </p>
                </button>
                <button
                  onClick={() => generarCodigo(p.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  title="Aplicación lineal (todos los ítems en orden)"
                >
                  Aplicar
                </button>
                <button
                  onClick={() => generarCodigo(p.id, true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-purple-700 text-white hover:bg-purple-800"
                  title="Aplicación adaptativa (CAT — selecciona ítems según habilidad)"
                >
                  CAT
                </button>
                <button
                  onClick={() => eliminar(p.id)}
                  className="text-xs text-slate-400 hover:text-rose-600 px-2"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activa && (
        <>
          <div className="flex flex-wrap gap-2 items-center bg-white border border-slate-200 rounded-xl shadow-sm p-3 sticky top-0 z-10 no-print">
            <span className="text-sm text-slate-700 mr-auto">
              <strong>Vista:</strong> {activa.nombre}
            </span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mostrarRespuestas}
                onChange={(e) => setMostrarRespuestas(e.target.checked)}
              />
              Ver respuestas
            </label>
            <button
              onClick={imprimirPDF}
              className="text-sm px-3 py-1.5 rounded bg-slate-800 text-white hover:bg-slate-900"
            >
              Imprimir / PDF
            </button>
            <button
              onClick={() => descargarWord(activa, mostrarRespuestas)}
              className="text-sm px-3 py-1.5 rounded bg-blue-700 text-white hover:bg-blue-800"
            >
              Descargar Word
            </button>
            <button
              onClick={() => generarCodigo(activa.id)}
              className="text-sm px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              title="Aplicación lineal"
            >
              Aplicar online
            </button>
            <button
              onClick={() => generarCodigo(activa.id, true)}
              className="text-sm px-3 py-1.5 rounded bg-purple-700 text-white hover:bg-purple-800"
              title="Aplicación adaptativa CAT"
            >
              Aplicar CAT
            </button>
            <button
              onClick={() => setActiva(null)}
              className="text-sm px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-white"
            >
              Cerrar
            </button>
          </div>

          <TestPreview instrumento={activa} mostrarRespuestas={mostrarRespuestas} />
        </>
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
