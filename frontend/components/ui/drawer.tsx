'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DrawerContext = React.createContext<DrawerContextValue | undefined>(undefined);

const useDrawer = () => {
  const context = React.useContext(DrawerContext);
  if (!context) throw new Error('Drawer components must be wrapped in a Drawer');
  return context;
};

interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Drawer = ({ open: controlledOpen, onOpenChange, children }: DrawerProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <DrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </DrawerContext.Provider>
  );
};

interface DrawerTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DrawerTrigger = React.forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  ({ onClick, asChild, children, ...props }, ref) => {
    const { setOpen } = useDrawer();

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          setOpen(true);
          const childOnClick = (children as any).props?.onClick;
          if (childOnClick) childOnClick(e);
        },
        ref,
      });
    }

    return (
      <button
        ref={ref}
        onClick={(e) => {
          setOpen(true);
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DrawerTrigger.displayName = 'DrawerTrigger';

interface DrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ className, children, side = 'right', size = 'lg', ...props }, ref) => {
    const { open, setOpen } = useDrawer();

    if (!open) return null;

    const sizeClasses = {
      sm: 'w-full max-w-sm',
      md: 'w-full max-w-md',
      lg: 'w-full max-w-2xl',
      xl: 'w-full max-w-4xl',
      full: 'w-full',
    };

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={() => setOpen(false)}
        />
        {/* Drawer Panel */}
        <div
          ref={ref}
          className={cn(
            'fixed z-50 h-full bg-white shadow-xl transition-transform duration-300 ease-in-out flex flex-col',
            side === 'right' ? 'right-0 top-0' : 'left-0 top-0',
            side === 'right'
              ? open
                ? 'translate-x-0'
                : 'translate-x-full'
              : open
              ? 'translate-x-0'
              : '-translate-x-full',
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);
DrawerContent.displayName = 'DrawerContent';

interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const DrawerHeader = React.forwardRef<HTMLDivElement, DrawerHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-2 p-6 border-b border-gray-200', className)}
      {...props}
    />
  )
);
DrawerHeader.displayName = 'DrawerHeader';

interface DrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const DrawerFooter = React.forwardRef<HTMLDivElement, DrawerFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-3 p-6 border-t border-gray-200', className)}
      {...props}
    />
  )
);
DrawerFooter.displayName = 'DrawerFooter';

interface DrawerTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const DrawerTitle = React.forwardRef<HTMLHeadingElement, DrawerTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-xl font-semibold text-gray-900', className)}
      {...props}
    />
  )
);
DrawerTitle.displayName = 'DrawerTitle';

interface DrawerDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const DrawerDescription = React.forwardRef<HTMLParagraphElement, DrawerDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-gray-500', className)} {...props} />
  )
);
DrawerDescription.displayName = 'DrawerDescription';

interface DrawerCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DrawerClose = React.forwardRef<HTMLButtonElement, DrawerCloseProps>(
  ({ className, ...props }, ref) => {
    const { setOpen } = useDrawer();
    return (
      <button
        ref={ref}
        onClick={() => setOpen(false)}
        className={cn(
          'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none',
          className
        )}
        {...props}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    );
  }
);
DrawerClose.displayName = 'DrawerClose';

export {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
};

