import type { Instrumento } from "../types";
import { NIVEL_LABELS, TIPO_LABELS } from "../types";

interface Props {
  instrumento: Instrumento;
  mostrarRespuestas?: boolean;
}

export default function TestPreview({ instrumento, mostrarRespuestas = false }: Props) {
  return (
    <div id="test-preview" className="test-preview bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="test-cover bg-gradient-to-br from-ceis-primary to-blue-700 text-white p-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-sm uppercase tracking-widest text-blue-200">CEIS Maristas</p>
            <p className="text-xs text-blue-200 mt-1">Centro de Estudios e Investigación Salesiana</p>
          </div>
          <div className="text-right text-xs text-blue-200">
            <p>Batería de Orientación Vocacional</p>
            <p>Documento técnico — uso pedagógico</p>
          </div>
        </div>

        <h1 className="text-3xl font-bold leading-tight mb-2">{instrumento.nombre}</h1>
        <p className="text-blue-100 text-lg">{TIPO_LABELS[instrumento.tipo]}</p>

        <div className="grid grid-cols-3 gap-6 mt-10 pt-6 border-t border-blue-400">
          <Stat label="Nivel" value={NIVEL_LABELS[instrumento.nivel]} />
          <Stat label="Ítems" value={String(instrumento.num_items || instrumento.items.length)} />
          <Stat
            label="Tiempo estimado"
            value={instrumento.tiempo_minutos ? `${instrumento.tiempo_minutos} min` : "—"}
          />
        </div>
      </div>

      <div className="p-10 print-content">
        <div className="mb-8 border-l-4 border-ceis-primary pl-4 py-1 bg-blue-50/50 rounded-r">
          <p className="text-xs uppercase tracking-wider text-ceis-primary font-semibold mb-1">
            Instrucciones
          </p>
          <p className="text-slate-800 leading-relaxed">{instrumento.instrucciones}</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 text-sm">
          <DataLine label="Nombre" />
          <DataLine label="Curso" />
          <DataLine label="Fecha" />
          <DataLine label="RUT / ID" />
        </div>

        <ol className="space-y-6 list-none">
          {instrumento.items.map((item, idx) => (
            <li key={item.id} className="item-question break-inside-avoid">
              <div className="flex gap-3">
                <span className="font-bold text-ceis-primary text-lg min-w-[2rem]">{idx + 1}.</span>
                <div className="flex-1">
                  {item.texto_base && (
                    <div className="mb-3 p-3 bg-slate-50 border-l-2 border-slate-300 text-sm text-slate-700 leading-relaxed">
                      {item.texto_base}
                    </div>
                  )}
                  <p className="text-slate-900 leading-relaxed mb-3">{item.enunciado}</p>
                  {item.imagen_url && (
                    <div className="mb-3 border border-slate-200 rounded overflow-hidden bg-white">
                      <img
                        src={`/uploads/${item.imagen_url}`}
                        alt="Ítem visual"
                        className="w-full max-h-[28rem] object-contain"
                      />
                    </div>
                  )}
                  {item.opciones && (
                    <ol className="space-y-1.5 ml-2">
                      {item.opciones.map((op) => {
                        const isCorrect =
                          mostrarRespuestas && item.respuesta_correcta === op.clave;
                        return (
                          <li
                            key={op.clave}
                            className={`flex gap-2 text-slate-700 leading-relaxed ${
                              isCorrect ? "bg-emerald-100 rounded px-2 py-0.5 font-medium" : ""
                            }`}
                          >
                            <span className="font-semibold w-6">{op.clave})</span>
                            <span>{op.texto}</span>
                            {isCorrect && (
                              <span className="ml-auto text-xs text-emerald-700">✓</span>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          CEIS Maristas · Batería de Orientación Vocacional · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-blue-200">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function DataLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 text-xs uppercase tracking-wider min-w-[3.5rem]">
        {label}:
      </span>
      <span className="flex-1 border-b border-slate-400 h-5"></span>
    </div>
  );
}
