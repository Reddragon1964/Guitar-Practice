import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "btn-raised inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[1px]",
          {
            "bg-gradient-to-b from-indigo-500 via-indigo-600 to-indigo-700 text-white border border-t-indigo-300/60 border-x-indigo-500/60 border-b-indigo-900 shadow-[0_3px_0_0_#1e1b4b,0_4px_8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] hover:from-indigo-400 hover:via-indigo-500 hover:to-indigo-600 hover:-translate-y-[1px] active:shadow-[0_1px_0_0_#1e1b4b,inset_0_2px_4px_rgba(0,0,0,0.4)]": variant === "default",
            "bg-gradient-to-b from-indigo-900/90 via-indigo-950 to-slate-950 text-indigo-50 border border-t-indigo-400/50 border-x-indigo-700/60 border-b-slate-950 shadow-[0_3px_0_0_#090d16,0_4px_8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] hover:from-indigo-800 hover:via-indigo-900 hover:to-indigo-950 hover:-translate-y-[1px] active:shadow-[0_1px_0_0_#090d16,inset_0_2px_4px_rgba(0,0,0,0.45)]": variant === "outline",
            "bg-gradient-to-b from-indigo-900/75 to-indigo-950/90 text-indigo-200 border border-t-indigo-400/40 border-x-indigo-800/50 border-b-indigo-950 shadow-[0_2px_0_0_#0f172a,0_3px_6px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] hover:from-indigo-800 hover:to-indigo-900 hover:text-white hover:-translate-y-[1px] active:shadow-[0_1px_0_0_#0f172a,inset_0_2px_3px_rgba(0,0,0,0.4)]": variant === "ghost",
            "bg-gradient-to-b from-red-500 via-red-600 to-red-700 text-white border border-t-red-300/60 border-x-red-500/60 border-b-red-950 shadow-[0_3px_0_0_#450a0a,0_4px_8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] hover:from-red-400 hover:via-red-500 hover:to-red-600 hover:-translate-y-[1px] active:shadow-[0_1px_0_0_#450a0a,inset_0_2px_4px_rgba(0,0,0,0.4)]": variant === "danger",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
