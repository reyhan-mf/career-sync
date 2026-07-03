import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // surface-container reads clearly on the white (surface-container-lowest)
      // cards used across the app, matching the existing JobDetailSkeleton.
      className={cn("animate-pulse rounded-md bg-surface-container", className)}
      {...props}
    />
  )
}

export { Skeleton }
