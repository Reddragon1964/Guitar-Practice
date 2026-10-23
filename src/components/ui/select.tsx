import * as React from "react"
import { cn } from "@/src/lib/utils"

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-blue-400 !bg-white bg-white !text-blue-700 text-blue-700 font-medium px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:!bg-white [&>option]:!text-blue-700 [&>optgroup]:!bg-white [&>optgroup]:!text-blue-700",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Select.displayName = "Select"

export { Select }
