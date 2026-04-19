import React from "react"
import { cn } from "../../lib/utils"

export const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded border border-[#27272A] bg-[#111] px-3 py-1 text-[0.8rem] text-white shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#A1A1AA] focus-visible:outline-none focus-visible:border-[#EAB308] focus-visible:ring-1 focus-visible:ring-[#EAB308] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
