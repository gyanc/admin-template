'use client';

import { ReactNode } from 'react';
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';

export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'switch' | 'custom';

export interface FormField<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  
  // For select fields
  options?: Array<{ value: string | number; label: string }>;
  
  // For custom fields
  render?: (field: {
    value: any;
    onChange: (value: any) => void;
    error?: string;
    disabled?: boolean;
  }) => ReactNode;
  
  // Validation
  min?: number;
  max?: number;
  pattern?: RegExp;
  
  // Styling
  className?: string;
  rows?: number; // For textarea
}

export interface FormDrawerProps<T extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  
  // Form configuration
  form: UseFormReturn<T>;
  fields: FormField<T>[];
  onSubmit: (data: T) => Promise<void> | void;
  
  // State
  loading?: boolean;
  mode?: 'create' | 'edit';
  
  // Labels
  submitLabel?: string;
  cancelLabel?: string;
  
  // Custom sections
  headerExtra?: ReactNode;
  footerExtra?: ReactNode;
  beforeFields?: ReactNode;
  afterFields?: ReactNode;
  
  // Styling
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

export function FormDrawer<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  icon,
  form,
  fields,
  onSubmit,
  loading = false,
  mode = 'edit',
  submitLabel,
  cancelLabel = 'Cancel',
  headerExtra,
  footerExtra,
  beforeFields,
  afterFields,
  size = 'lg',
  className = '',
}: FormDrawerProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = form;

  const defaultSubmitLabel = mode === 'create' ? 'Create' : 'Save Changes';

  const renderField = (field: FormField<T>) => {
    const error = errors[field.name]?.message as string | undefined;
    const isDisabled = field.disabled || isSubmitting;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return (
          <div key={String(field.name)} className="space-y-2">
            <Label htmlFor={String(field.name)} className="text-sm font-semibold">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
            <Input
              id={String(field.name)}
              type={field.type}
              placeholder={field.placeholder}
              disabled={isDisabled}
              className={error ? 'border-red-500' : ''}
              {...register(field.name, {
                valueAsNumber: field.type === 'number',
              })}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={String(field.name)} className="space-y-2">
            <Label htmlFor={String(field.name)} className="text-sm font-semibold">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
            <Textarea
              id={String(field.name)}
              placeholder={field.placeholder}
              disabled={isDisabled}
              rows={field.rows || 4}
              className={error ? 'border-red-500' : ''}
              {...register(field.name)}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={String(field.name)} className="space-y-2">
            <Label htmlFor={String(field.name)} className="text-sm font-semibold">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
            <Select
              value={watch(field.name)?.toString()}
              onValueChange={(value) => {
                if (!isDisabled) {
                  // Convert to number if needed
                  const finalValue = field.type === 'number' ? Number(value) : value;
                  setValue(field.name, finalValue as any, { shouldValidate: true });
                }
              }}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''} disabled={isDisabled}>
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        );

      case 'switch':
        return (
          <div key={String(field.name)} className="flex items-center justify-between space-x-2 py-2">
            <div className="space-y-0.5">
              <Label htmlFor={String(field.name)} className="text-sm font-semibold">
                {field.label}
              </Label>
              {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id={String(field.name)}
                checked={watch(field.name)}
                onChange={(e) => setValue(field.name, e.target.checked as any, { shouldValidate: true })}
                disabled={isDisabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            </label>
          </div>
        );

      case 'custom':
        return field.render ? (
          <div key={String(field.name)} className="space-y-2">
            <Label className="text-sm font-semibold">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
            {field.render({
              value: watch(field.name),
              onChange: (value) => setValue(field.name, value, { shouldValidate: true }),
              error,
              disabled: isDisabled,
            })}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent size={size} className={`flex flex-col max-h-screen overflow-hidden ${className}`}>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            <DrawerHeader className="flex-shrink-0">
              <div className="flex items-center gap-4">
                {icon && (
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-semibold">
                    {icon}
                  </div>
                )}
                <div className="flex-1">
                  <DrawerTitle>{title}</DrawerTitle>
                  {description && <DrawerDescription>{description}</DrawerDescription>}
                </div>
                <DrawerClose />
              </div>
              {headerExtra}
            </DrawerHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {beforeFields}
                {fields.map((field) => renderField(field))}
                {afterFields}
              </div>

              <DrawerFooter className="flex-shrink-0 border-t border-gray-200">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {footerExtra}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSubmitting}
                    >
                      {cancelLabel}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {submitLabel || defaultSubmitLabel}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DrawerFooter>
            </form>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
