import { cn } from "../../utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "primary" | "accent";
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: "bg-ink-100 text-ink-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  primary: "bg-primary-100 text-primary-700",
  accent: "bg-accent-100 text-accent-700",
};

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("badge", variantClasses[variant], className)}>
      {children}
    </span>
  );
}
