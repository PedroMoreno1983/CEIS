const VARIANTS: Record<string, string> = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300",
  secondary:
    "bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 disabled:opacity-50",
  danger:
    "bg-rose-600 hover:bg-rose-700 text-white disabled:bg-rose-300",
  ghost:
    "bg-transparent hover:bg-slate-100 text-slate-600 disabled:opacity-50",
};

const SIZES: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
