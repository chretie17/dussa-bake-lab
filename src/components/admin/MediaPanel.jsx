import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'
import { Button } from '../ui'
import {
  ACCEPTED,
  deleteImage,
  formatBytes,
  listImages,
  uploadImage,
} from '../../lib/images'
import { classNames, prettyDateTime } from '../../lib/format'

/**
 * Everything the bakery has uploaded, in one place. Photos live in the same
 * database as the orders, so there is no second account to manage.
 */
export default function MediaPanel({ adminKey, usedUrls = [] }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState('')
  const [confirming, setConfirming] = useState(null)
  const inputRef = useRef(null)

  const refresh = useCallback(async () => {
    try {
      setImages(await listImages(adminKey))
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load your photos.')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleFiles = async (fileList) => {
    const files = [...(fileList || [])].filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    setUploading(files.length)
    setError('')
    for (const file of files) {
      try {
        await uploadImage(file, adminKey)
      } catch (e) {
        setError(`${file.name}: ${e.message}`)
      }
      setUploading((n) => n - 1)
    }
    refresh()
  }

  const copy = async (url) => {
    const full = `${window.location.origin}${url}`
    try {
      await navigator.clipboard.writeText(full)
      setCopied(url)
      setTimeout(() => setCopied(''), 1800)
    } catch {
      /* clipboard blocked; the link is visible on screen anyway */
    }
  }

  const remove = async (id) => {
    try {
      await deleteImage(id, adminKey)
      setConfirming(null)
      refresh()
    } catch (e) {
      setError(e.message || 'Could not delete that photo.')
    }
  }

  const totalBytes = images.reduce((sum, i) => sum + (i.bytes || 0), 0)

  return (
    <div className="mt-8">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={classNames(
          'flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed px-6 py-12 text-center transition-colors',
          dragging
            ? 'border-caramel bg-blush/50'
            : 'border-caramel/35 bg-porcelain hover:border-caramel hover:bg-blush/25',
        )}
      >
        {uploading > 0 ? (
          <>
            <Loader2 size={26} className="animate-spin text-caramel" />
            <p className="mt-3 font-medium text-espresso">
              Uploading {uploading} photo{uploading === 1 ? '' : 's'}…
            </p>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blush text-choco">
              <Upload size={22} strokeWidth={1.8} />
            </div>
            <p className="mt-4 font-display text-[1.15rem] text-espresso">
              Drop your photos here
            </p>
            <p className="mt-1.5 max-w-md text-[0.85rem] leading-relaxed text-cocoa/60">
              Or click to pick them off your computer or phone. You can drop several at once. Big
              camera photos get shrunk automatically so the site stays quick to load.
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[0.85rem] text-red-700">{error}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.85rem] text-cocoa/60">
          {images.length} photo{images.length === 1 ? '' : 's'}
          {images.length > 0 && ` · ${formatBytes(totalBytes)} in total`}
        </p>
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="mt-10 flex items-center justify-center gap-3 text-cocoa/55">
          <Loader2 size={18} className="animate-spin" /> Loading your photos…
        </div>
      ) : images.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-caramel/30 bg-porcelain/60 p-12 text-center">
          <ImageIcon size={30} strokeWidth={1.4} className="mx-auto text-caramel" />
          <h3 className="mt-4 font-display text-xl text-espresso">No photos yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-[0.9rem] leading-relaxed text-cocoa/60">
            Once you upload a few, you can attach them to any product without hunting for the file
            again.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((image) => {
            const inUse = usedUrls.includes(image.url)
            return (
              <motion.figure
                key={image.id}
                layout
                className="overflow-hidden rounded-2xl border border-caramel/22 bg-porcelain"
              >
                <div className="relative">
                  <img
                    src={image.url}
                    alt={image.alt || image.filename}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                  {inUse && (
                    <span className="absolute left-3 top-3 rounded-full bg-espresso/85 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-cream">
                      On the site
                    </span>
                  )}
                </div>

                <figcaption className="p-3.5">
                  <p className="truncate text-[0.82rem] font-medium text-espresso">
                    {image.filename || image.id}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] text-cocoa/50">
                    {image.width > 0 && `${image.width}×${image.height} · `}
                    {formatBytes(image.bytes)} · {prettyDateTime(image.createdAt)}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => copy(image.url)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-caramel/28 py-1.5 text-[0.75rem] font-medium text-cocoa transition-colors hover:border-caramel hover:bg-blush/50"
                    >
                      {copied === image.url ? (
                        <>
                          <Check size={12} strokeWidth={2.6} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy link
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(image)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-cocoa/45 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${image.filename || image.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </figcaption>
              </motion.figure>
            )
          })}
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-5">
          <div
            className="absolute inset-0 bg-espresso/60 backdrop-blur-sm"
            onClick={() => setConfirming(null)}
          />
          <div className="relative w-full max-w-sm rounded-[1.5rem] border border-caramel/25 bg-cream p-6 shadow-lift">
            <h3 className="font-display text-[1.25rem] text-espresso">Delete this photo?</h3>
            <p className="mt-2.5 text-[0.9rem] leading-relaxed text-cocoa/65">
              {usedUrls.includes(confirming.url)
                ? 'It is being used by a product right now. That product will go back to showing its drawing.'
                : 'It is not attached to anything, so nothing on the site will change.'}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>
                Keep it
              </Button>
              <Button variant="danger" size="sm" onClick={() => remove(confirming.id)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
