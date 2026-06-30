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
  /** Icon component from react-icons/hi2 */
  icon?: IconType;
  iconPosition?: "start" | "end";
}

function renderIcon(Icon: IconType) {
  return <Icon className="size-4 shrink-0" aria-hidden />;
}

function injectIconIntoChild(
  children: React.ReactNode,
  Icon: IconType,
  iconPosition: "start" | "end"
): React.ReactNode {
  if (!React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return children;
  }

  const childContent = children.props.children;
  const iconNode = renderIcon(Icon);

  return React.cloneElement(children, {
    children:
      iconPosition === "end" ? (
        <>
          {childContent}
          {iconNode}
        </>
      ) : (
        <>
          {iconNode}
          {childContent}
        </>
      ),
  });
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
  const classes = cn(buttonVariants({ variant, size, className }));

  if (asChild) {
    return (
      <Comp className={classes} {...props}>
        {Icon
          ? injectIconIntoChild(children, Icon, iconPosition)
          : children}
      </Comp>
    );
  }

  return (
    <Comp className={classes} {...props}>
      {Icon && iconPosition === "start" && renderIcon(Icon)}
      {children}
      {Icon && iconPosition === "end" && renderIcon(Icon)}
    </Comp>
  );
}

export { Button, buttonVariants };
