import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variante =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "success";

type Tamano = "sm" | "md" | "lg" | "icon";

const variantes: Record<Variante, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-[#9c4708] active:bg-[#8a3e06]",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-[#e9ddc9] active:bg-[#e2d4bd]",
  outline:
    "border border-input bg-card text-foreground shadow-sm hover:bg-muted active:bg-secondary",
  ghost: "text-foreground hover:bg-muted active:bg-secondary",
  destructive:
    "bg-destructive text-destructive-foreground shadow-sm hover:bg-[#981b12]",
  success:
    "bg-success text-success-foreground shadow-sm hover:bg-[#116631]",
};

const tamanos: Record<Tamano, string> = {
  sm: "h-9 gap-1.5 rounded-lg px-3 text-sm",
  md: "h-11 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2 rounded-xl px-5 text-base",
  icon: "h-10 w-10 rounded-xl",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variante;
  size?: Tamano;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-semibold transition-colors disabled:pointer-events-none disabled:opacity-55",
        variantes[variant],
        tamanos[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
);

Button.displayName = "Button";
