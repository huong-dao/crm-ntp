import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#1e3a5f] text-white hover:bg-[#16304f]",
        outline:
          "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900",
        ghost: "hover:bg-gray-100 text-gray-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Icon component from react-icons (e.g. HiMiniCheck from react-icons/hi2) */
  icon?: IconType;
  iconPosition?: "start" | "end";
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  icon: Icon,
  iconPosition = "start",
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {Icon && iconPosition === "start" && (
            <Icon className="size-4 shrink-0" aria-hidden />
          )}
          {children}
          {Icon && iconPosition === "end" && (
            <Icon className="size-4 shrink-0" aria-hidden />
          )}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
