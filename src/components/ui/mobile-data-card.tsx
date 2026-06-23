import { cn } from "@/lib/utils";

export function MobileDataCard({
  children,
  actions,
  className,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-4 shadow-sm",
        className
      )}
    >
      {children}
      {actions && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {actions}
        </div>
      )}
    </div>
  );
}

export function MobileDataRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 text-sm">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="text-right text-gray-900">{children}</span>
    </div>
  );
}
