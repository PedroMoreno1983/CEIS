export default function PlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-500 mb-6">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Predicción</h2>
      <p className="text-slate-500 max-w-md mb-6">
        Módulo en desarrollo. Aquí podrás visualizar análisis predictivo de resultados académicos,
        alertas tempranas y tendencias institucionales basadas en la data histórica del colegio.
      </p>
      <div className="flex gap-3">
        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-violet-100 text-violet-700">
          Próximamente
        </span>
      </div>

      {/* Mock de features futuras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-2xl w-full">
        <FeatureMock icon={<TrendIcon />} title="Tendencias" desc="Evolución de promedios por curso y asignatura" />
        <FeatureMock icon={<AlertIcon />} title="Alertas tempranas" desc="Identificación de estudiantes en riesgo" />
        <FeatureMock icon={<TargetIcon />} title="Metas" desc="Proyección de logro de objetivos institucionales" />
      </div>
    </div>
  );
}

function FeatureMock({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 opacity-60">
      <div className="text-slate-400 mb-2">{icon}</div>
      <h3 className="text-sm font-bold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-400">{desc}</p>
    </div>
  );
}

function TrendIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}
function AlertIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function TargetIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}
