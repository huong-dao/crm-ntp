import Link from "next/link";
import { getPaginationItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const navButtonClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50";

const pageButtonClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-medium transition-colors";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  getPageHref: (page: number) => string;
  summary?: React.ReactNode;
  className?: string;
};

function NavControl({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        className={cn(navButtonClass, "pointer-events-none opacity-50")}
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={navButtonClass}>
      {children}
    </Link>
  );
}

export function TablePagination({
  page,
  totalPages,
  getPageHref,
  summary,
  className,
}: TablePaginationProps) {
  if (totalPages <= 1 && !summary) return null;

  const items = getPaginationItems(page, totalPages);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 text-sm text-gray-600",
        summary ? "justify-between" : "justify-center",
        className
      )}
    >
      {summary ? <p>{summary}</p> : null}
      {totalPages > 1 ? (
        <nav aria-label="Phân trang" className="flex flex-wrap items-center gap-1">
          <NavControl
            href={getPageHref(1)}
            disabled={page <= 1}
            label="Trang đầu"
          >
            &laquo;&laquo;
          </NavControl>
          <NavControl
            href={getPageHref(page - 1)}
            disabled={page <= 1}
            label="Trang trước"
          >
            &laquo;
          </NavControl>

          {items.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex h-8 min-w-8 items-center justify-center px-1 text-xs text-gray-400"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Link
                key={item}
                href={getPageHref(item)}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  pageButtonClass,
                  item === page
                    ? "border-[#1e3a5f] bg-[#1e3a5f] text-white hover:bg-[#16304f]"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                {item}
              </Link>
            )
          )}

          <NavControl
            href={getPageHref(page + 1)}
            disabled={page >= totalPages}
            label="Trang sau"
          >
            &raquo;
          </NavControl>
          <NavControl
            href={getPageHref(totalPages)}
            disabled={page >= totalPages}
            label="Trang cuối"
          >
            &raquo;&raquo;
          </NavControl>
        </nav>
      ) : null}
    </div>
  );
}
