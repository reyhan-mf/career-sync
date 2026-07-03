import { Skeleton } from "./skeleton";

// Composable skeleton building blocks that mirror the app's recurring layouts
// (stat-card grids, section cards, list rows, tables). Pages drop these into
// their loading branch so the placeholder matches the real content shape and
// the page doesn't jump when data arrives.

/** Title + subtitle, optionally with a trailing action button. */
export function PageHeaderSkeleton({ withButton = false }: { withButton?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {withButton && <Skeleton className="h-10 w-36 rounded-xl shrink-0" />}
    </div>
  );
}

/** Single metric card matching <StatCard />. */
export function StatCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
      <Skeleton className="w-12 h-12 rounded-xl mb-4" />
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-7 w-16" />
    </div>
  );
}

/** Responsive grid of metric cards. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Generic section card: heading + a few text lines. */
export function CardSkeleton({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border space-y-3 ${className}`}
    >
      <Skeleton className="h-6 w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

/** Avatar + two text lines + trailing badge — a typical list item. */
export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-12 rounded-full shrink-0" />
    </div>
  );
}

/** Card containing a heading + a list of ListRow placeholders. */
export function ListCardSkeleton({
  rows = 4,
  withHeader = true,
}: {
  rows?: number;
  withHeader?: boolean;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
      {withHeader && (
        <div className="mb-5 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
      )}
      <div className="space-y-1">
        {Array.from({ length: rows }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton <tr> rows for a <table> body. Render INSIDE a <tbody> while data
 * loads, keeping the real <thead> visible so columns don't shift.
 */
export function TableRowsSkeleton({
  rows = 6,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-surface-variant last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-6 py-4">
              <Skeleton className={`h-4 ${c === 0 ? "w-32" : "w-20"}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
