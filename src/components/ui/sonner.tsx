"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-orbital-surface group-[.toaster]:text-orbital-white group-[.toaster]:border-border group-[.toaster]:shadow-card",
          description: "group-[.toast]:text-orbital-muted",
          actionButton:
            "group-[.toast]:bg-orbital-gold group-[.toast]:text-orbital-deep",
          cancelButton:
            "group-[.toast]:bg-orbital-surface-hover group-[.toast]:text-orbital-muted",
        },
      }}
      {...props}
    />
  );
}
