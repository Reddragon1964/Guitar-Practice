import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-blue-400 !bg-white bg-white !text-blue-700 text-blue-700 font-medium px-3 py-2 text-sm placeholder:!text-blue-400 placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50",
          type === "date" && "accent-emerald-500 [color-scheme:light]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
