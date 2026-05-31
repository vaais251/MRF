// Client-side image helpers. Resize/compress images in the browser before
// uploading them as base64 data URLs, so database rows stay small.

export interface ResizeOptions {
  maxSize?: number // longest edge in pixels
  quality?: number // 0..1 for JPEG output
  mimeType?: string
}

const DEFAULT_MAX_FILE_BYTES = 8 * 1024 * 1024 // reject sources larger than 8MB

/**
 * Reads an image File, downscales it so its longest edge is at most `maxSize`,
 * re-encodes it (JPEG by default) and resolves with a `data:` URL string.
 */
export async function fileToResizedDataUrl(
  file: File,
  { maxSize = 1280, quality = 0.82, mimeType = "image/jpeg" }: ResizeOptions = {}
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file")
  }
  if (file.size > DEFAULT_MAX_FILE_BYTES) {
    throw new Error("Image must be smaller than 8MB")
  }

  const dataUrl = await readFileAsDataUrl(file)
  const img = await loadImage(dataUrl)

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)

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

  return canvas.toDataURL(mimeType, quality)
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
