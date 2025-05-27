import React from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"
import { useToast } from "./use-toast"

// Use a type assertion to bypass the TypeScript checks
const AnyComponent = (component: any) => component as React.ComponentType<any>;

export function Toaster() {
  const { toasts } = useToast()

  // Apply the type assertion to all components
  const TypedToastProvider = AnyComponent(ToastProvider);
  const TypedToast = AnyComponent(Toast);
  const TypedToastTitle = AnyComponent(ToastTitle);
  const TypedToastDescription = AnyComponent(ToastDescription);
  const TypedToastClose = AnyComponent(ToastClose);
  const TypedToastViewport = AnyComponent(ToastViewport);

  return (
    <TypedToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <TypedToast key={id} {...props}>
            <div className="grid gap-1">
              {title && <TypedToastTitle>{title}</TypedToastTitle>}
              {description && (
                <TypedToastDescription>{description}</TypedToastDescription>
              )}
            </div>
            {action}
            <TypedToastClose />
          </TypedToast>
        )
      })}
      <TypedToastViewport />
    </TypedToastProvider>
  )
} 