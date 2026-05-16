const VARIANTS: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
};

export default function Badge({
  children,
  variant = "slate",
}: {
  children: React.ReactNode;
  variant?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${VARIANTS[variant] || VARIANTS.slate}`}
    >
      {children}
    </span>
  );
}
