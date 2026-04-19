import React from "react"
import { cn } from "../../lib/utils"

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline"
}) {
  const variants = {
    default: "bg-[#EAB308] text-black",
    secondary: "border border-green-500/20 bg-green-500/10 text-green-500",
    destructive: "bg-[#EF4444] text-white",
    outline: "border border-[#27272A] text-[#A1A1AA]",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded border px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
