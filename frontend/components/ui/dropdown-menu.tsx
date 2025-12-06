import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined)

const useDropdown = () => {
  const context = React.useContext(DropdownContext)
  if (!context) throw new Error("Dropdown components must be wrapped in a DropdownMenu")
  return context
}

interface DropdownMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const DropdownMenu = ({ open: controlledOpen, onOpenChange, children }: DropdownMenuProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value)
    onOpenChange?.(value)
  }

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownContext.Provider>
  )
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ onClick, asChild, children, ...props }, ref) => {
    const { setOpen, open } = useDropdown()
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          setOpen(!open)
          const childOnClick = (children as any).props?.onClick
          if (childOnClick) childOnClick(e)
        },
        ref,
      })
    }
    
    return (
      <button
        ref={ref}
        onClick={(e) => {
          setOpen(!open)
          onClick?.(e)
        }}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, ...props }, ref) => {
    const { open, setOpen } = useDropdown()

    if (!open) return null

    return (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
        <div
          ref={ref}
          className={cn(
            "absolute top-full mt-1 min-w-[200px] rounded-md border border-neutral-200 bg-white p-1 shadow-md z-50",
            className
          )}
          {...props}
        />
      </>
    )
  }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
  disabled?: boolean
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, inset, disabled, onClick, ...props }, ref) => {
    const { setOpen } = useDropdown()
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-neutral-100 focus:bg-neutral-100",
          inset && "pl-8",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={(e) => {
          if (!disabled) {
            setOpen(false)
            onClick?.(e)
          }
        }}
        {...props}
      />
    )
  }
)
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-neutral-100", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest text-neutral-500", className)} {...props} />
)
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
DropdownMenuGroup.displayName = "DropdownMenuGroup"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
}
