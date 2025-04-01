/**
 * This component provides tooltip functionality using Radix UI primitives.
 * Properly typed with TypeScript to avoid compilation errors.
 */
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

// Primitive exports for composition
const TooltipProvider = TooltipPrimitive.Provider
const TooltipRoot = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

/**
 * Props for TooltipContent component
 * Extends Radix UI's Content props and adds className and sideOffset
 */
interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
    className?: string;
    sideOffset?: number;
}

/**
 * TooltipContent component with proper TypeScript typing
 */
const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    TooltipContentProps
>(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
            "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
        )}
        {...props}
    />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

/**
 * Props for the convenience Tooltip component
 */
interface TooltipProps {
    children: React.ReactNode;
    content: React.ReactNode;
}

/**
 * Convenient Tooltip component for typical usage
 */
const Tooltip: React.FC<TooltipProps> = ({ children, content }) => (
    <TooltipProvider>
        <TooltipRoot>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent>
                <p className="font-light">{content}</p>
            </TooltipContent>
        </TooltipRoot>
    </TooltipProvider>
)

// Named exports
export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } 