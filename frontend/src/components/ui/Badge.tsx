import { cn } from "@/lib/utils";

const VARIANTS: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  rose: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
  violet: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100",
  slate: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  // shadcn-style variants
  default: "bg-primary text-primary-foreground border-transparent hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80",
  outline: "bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground border-transparent hover:bg-destructive/90",
};

export default function Badge({
  children,
  variant = "slate",
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border transition-colors",
        VARIANTS[variant] || VARIANTS.slate,
        className
      )}
    >
      {children}
    </span>
  );
}
