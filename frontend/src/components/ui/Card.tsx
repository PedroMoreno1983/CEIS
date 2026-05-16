export default function Card({
  children,
  className = "",
  padding = "normal",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "normal" | "large";
}) {
  const paddingClass =
    padding === "none" ? "" : padding === "large" ? "p-6" : "p-5";
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm ${paddingClass} ${className}`}
    >
      {children}
    </div>
  );
}
