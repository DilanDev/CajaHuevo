"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  cerrarAlFondo?: boolean;
};

const tamanos = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

const FOCALIZABLES =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  cerrarAlFondo = true,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const tituloId = useId();
  const descripcionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const enfocadoAntes = document.activeElement as HTMLElement | null;
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const temporizador = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const primerElemento = panel.querySelector<HTMLElement>(FOCALIZABLES);
      (primerElemento ?? panel).focus();
    }, 30);

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        onCloseRef.current();
        return;
      }

      if (evento.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const elementos = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCALIZABLES)
      ).filter((elemento) => elemento.offsetParent !== null);

      if (elementos.length === 0) {
        evento.preventDefault();
        panel.focus();
        return;
      }

      const primero = elementos[0];
      const ultimo = elementos[elementos.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", alPresionarTecla);

    return () => {
      window.clearTimeout(temporizador);
      document.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = overflowOriginal;
      enfocadoAntes?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="animar-fondo fixed inset-0 z-50 flex items-end justify-center bg-[#1a140e]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(evento) => {
        if (cerrarAlFondo && evento.target === evento.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={description ? descripcionId : undefined}
        tabIndex={-1}
        className={cn(
          "animar-dialogo flex max-h-[92svh] w-full flex-col rounded-t-3xl border bg-card shadow-2xl outline-none sm:max-h-[88vh] sm:rounded-2xl",
          tamanos[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4 md:px-6">
          <div className="min-w-0">
            <h2
              id={tituloId}
              className="font-display text-xl font-semibold text-foreground"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descripcionId}
                className="mt-0.5 text-sm text-muted-foreground"
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t bg-muted/35 px-5 py-4 sm:flex-row sm:justify-end md:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
