// Client-side image helpers. Resize/compress images in the browser before
// uploading them as base64 data URLs, so database rows (and payloads) stay small.

export interface ResizeOptions {
  maxSize?: number // longest edge in pixels
  quality?: number // initial JPEG quality (0..1)
  mimeType?: string
  maxBytes?: number // hard cap on the encoded image; quality/size is reduced until met
}

// Shared presets so every upload point uses the same, safe limits.
export const PROFILE_IMAGE: ResizeOptions = { maxSize: 256, quality: 0.85, maxBytes: 120_000 } // ~120 KB
export const ACTIVITY_IMAGE: ResizeOptions = { maxSize: 1280, quality: 0.82, maxBytes: 600_000 } // ~600 KB

const MAX_SOURCE_BYTES = 15 * 1024 * 1024 // reject source files larger than 15MB outright

/** Approximate the decoded byte size of a base64 data URL. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",")
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding)
}

/**
 * Reads an image File, downscales it so its longest edge is at most `maxSize`,
 * re-encodes it (JPEG by default), and — if `maxBytes` is set — keeps reducing
 * quality (then dimensions) until the result fits the budget. Resolves with a
 * `data:` URL string that is guaranteed to be reasonably small.
 */
export async function fileToResizedDataUrl(
  file: File,
  { maxSize = 1280, quality = 0.82, mimeType = "image/jpeg", maxBytes }: ResizeOptions = {}
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file")
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Image is too large (max 15MB)")
  }

  const srcUrl = await readFileAsDataUrl(file)
  const img = await loadImage(srcUrl)

  let scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  let q = quality
  let out = ""

  // A handful of attempts: drop quality first, then shrink dimensions, until under budget.
  for (let attempt = 0; attempt < 8; attempt++) {
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not process image")

    // White backdrop so transparent PNGs don't turn black when flattened to JPEG
    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(img, 0, 0, width, height)

    out = canvas.toDataURL(mimeType, q)

    if (!maxBytes || dataUrlBytes(out) <= maxBytes) return out

    if (q > 0.5) {
      q -= 0.12 // reduce quality first (cheap, preserves dimensions)
    } else {
      scale *= 0.82 // then shrink the image
    }
  }

  return out
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Could not read file"))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Could not load image"))
    img.src = src
  })
}
