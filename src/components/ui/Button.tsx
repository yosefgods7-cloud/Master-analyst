import React from "react"
import { cn } from "../../lib/utils"

export const Button = ({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded font-bold uppercase tracking-widest text-[0.7rem] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#EAB308] disabled:pointer-events-none disabled:opacity-50"
  
  const variants = {
    default: "bg-[#EAB308] text-black shadow hover:bg-[#EAB308]/90",
    destructive: "bg-[#EF4444] text-white shadow-sm hover:bg-[#EF4444]/90",
    outline: "border border-[#27272A] bg-transparent text-white hover:bg-[#27272A]",
    ghost: "hover:bg-[#27272A] text-white",
  }
  
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded px-3 text-[0.65rem]",
    lg: "h-10 rounded px-8",
    icon: "h-9 w-9",
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  )
}
