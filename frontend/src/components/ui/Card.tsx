import * as React from "react";
import { cn } from "@/lib/utils";

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
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm",
        paddingClass,
        className
      )}
    >
      {children}
    </div>
  );
}
