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
    const triggerRef = React.useRef<HTMLElement | null>(null)
    
    React.useEffect(() => {
      // Remove active attribute from all triggers
      document.querySelectorAll('[data-dropdown-trigger-active]').forEach(el => {
        el.removeAttribute('data-dropdown-trigger-active')
      })
      
      // Add active attribute to current trigger if open
      if (open && triggerRef.current) {
        triggerRef.current.setAttribute('data-dropdown-trigger-active', 'true')
      }
    }, [open])
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          setOpen(!open)
          const childOnClick = (children as any).props?.onClick
          if (childOnClick) childOnClick(e)
        },
        ref: (node: HTMLElement | null) => {
          triggerRef.current = node
          if (typeof ref === 'function') ref(node as HTMLButtonElement)
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node as HTMLButtonElement
        },
      })
    }
    
    return (
      <button
        ref={(node) => {
          triggerRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
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

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end' | 'center'
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = 'start', ...props }, ref) => {
    const { open, setOpen } = useDropdown()
    const contentRef = React.useRef<HTMLDivElement>(null)
    const triggerRef = React.useRef<HTMLElement | null>(null)

    React.useEffect(() => {
      if (open && contentRef.current) {
        // Find the active trigger
        const activeTrigger = document.querySelector('[data-dropdown-trigger-active]') as HTMLElement
        if (activeTrigger) {
          triggerRef.current = activeTrigger
          const rect = activeTrigger.getBoundingClientRect()
          const content = contentRef.current
          
          let left = rect.left
          let top = rect.bottom + 4
          
          // Adjust based on align prop
          if (align === 'end') {
            left = rect.right - content.offsetWidth
          } else if (align === 'center') {
            left = rect.left + (rect.width / 2) - (content.offsetWidth / 2)
          }
          
          // Ensure it doesn't go off screen
          if (left + content.offsetWidth > window.innerWidth) {
            left = window.innerWidth - content.offsetWidth - 8
          }
          if (left < 8) {
            left = 8
          }
          
          content.style.position = 'fixed'
          content.style.top = `${top}px`
          content.style.left = `${left}px`
        }
      }
    }, [open, align])

    if (!open) return null

    return (
      <>
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
        <div
          ref={(node) => {
            if (typeof ref === 'function') ref(node)
            else if (ref) ref.current = node
            contentRef.current = node
          }}
          className={cn(
            "min-w-[200px] rounded-md border border-neutral-200 bg-white p-1 shadow-lg z-50",
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
