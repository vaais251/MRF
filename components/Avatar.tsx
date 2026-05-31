import { cn } from "@/lib/utils"

interface AvatarProps {
  name?: string | null
  image?: string | null
  className?: string
  textClassName?: string
}

export function getInitials(name?: string | null) {
  if (!name) return "U"
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

/**
 * Renders a user's profile picture when available, otherwise their initials.
 * Sizing/colours are controlled via `className` so it can adapt to each context.
 */
export function Avatar({ name, image, className, textClassName }: AvatarProps) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name || "Profile picture"}
        className={cn("rounded-full object-cover", className)}
      />
    )
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold select-none",
        className
      )}
    >
      <span className={textClassName}>{getInitials(name)}</span>
    </div>
  )
}
