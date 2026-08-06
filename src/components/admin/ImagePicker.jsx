import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ImageIcon, Link2, Loader2, Trash2, Upload, X } from 'lucide-react'
import { TextInput } from '../Field'
import { Button } from '../ui'
import { ACCEPTED, formatBytes, listImages, uploadImage } from '../../lib/images'
import { classNames } from '../../lib/format'

/**
 * Picks the photo for a product. Three ways in: drop a file, choose one you
 * uploaded before, or paste a link. Leaving it empty keeps the illustration.
 */
export default function ImagePicker({ value, onChange, adminKey, alt = '' }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [library, setLibrary] = useState([])
  const [showLibrary, setShowLibrary] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!showLibrary) return
    listImages(adminKey)
      .then(setLibrary)
      .catch((e) => setError(e.message))
  }, [showLibrary, adminKey])

  const handleFiles = async (files) => {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const image = await uploadImage(file, adminKey, alt)
      onChange(image.url)
    } catch (e) {
      setError(e.message || 'That upload did not work.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative overflow-hidden rounded-2xl border border-caramel/25 bg-blush/30"
          >
            <img
              src={value}
              alt="Chosen photo"
              className="h-56 w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="flex items-center justify-between gap-3 border-t border-caramel/20 bg-porcelain px-4 py-3">
              <p className="truncate text-[0.78rem] text-cocoa/60">{value}</p>
              <button
                type="button"
                onClick={() => onChange('')}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-caramel/30 px-3 py-1.5 text-[0.75rem] font-medium text-cocoa transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
              'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-11 text-center transition-colors',
              dragging
                ? 'border-caramel bg-blush/50'
                : 'border-caramel/35 bg-porcelain hover:border-caramel hover:bg-blush/25',
            )}
          >
            {uploading ? (
              <>
                <Loader2 size={26} className="animate-spin text-caramel" />
                <p className="mt-3 text-[0.9rem] font-medium text-espresso">Uploading…</p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blush text-choco">
                  <Upload size={20} strokeWidth={1.8} />
                </div>
                <p className="mt-3 text-[0.9rem] font-medium text-espresso">
                  Drop a photo here, or click to choose one
                </p>
                <p className="mt-1 text-[0.78rem] text-cocoa/55">
                  JPG, PNG or WebP. Straight off your phone is fine, we shrink it for you.
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="mt-2.5 text-[0.78rem] text-red-700">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-full border border-caramel/30 px-3.5 py-1.5 text-[0.78rem] font-medium text-cocoa transition-colors hover:border-caramel hover:bg-blush/50"
        >
          <Upload size={13} /> Upload
        </button>
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-caramel/30 px-3.5 py-1.5 text-[0.78rem] font-medium text-cocoa transition-colors hover:border-caramel hover:bg-blush/50"
        >
          <ImageIcon size={13} /> Choose an earlier photo
        </button>
        <button
          type="button"
          onClick={() => {
            setLinkValue(value || '')
            setShowLink((v) => !v)
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-caramel/30 px-3.5 py-1.5 text-[0.78rem] font-medium text-cocoa transition-colors hover:border-caramel hover:bg-blush/50"
        >
          <Link2 size={13} /> Paste a link
        </button>
      </div>

      {showLink && (
        <div className="mt-3 flex gap-2">
          <TextInput
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder="https://… or /images/cake.jpg"
            className="h-10 text-[0.85rem]"
          />
          <Button
            size="sm"
            onClick={() => {
              onChange(linkValue.trim())
              setShowLink(false)
            }}
          >
            Use it
          </Button>
        </div>
      )}

      {showLibrary && (
        <MediaModal
          images={library}
          onPick={(url) => {
            onChange(url)
            setShowLibrary(false)
          }}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  )
}

export function MediaModal({ images, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-espresso/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[80vh] w-full max-w-3xl flex-col rounded-[1.5rem] border border-caramel/25 bg-cream shadow-lift">
        <header className="flex items-center justify-between border-b border-caramel/22 px-6 py-4">
          <h3 className="font-display text-[1.2rem] text-espresso">Your photos</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-caramel/30 text-espresso transition-colors hover:bg-blush/60"
            aria-label="Close"
          >
            <X size={17} strokeWidth={1.8} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {images.length === 0 ? (
            <p className="py-12 text-center text-[0.9rem] text-cocoa/55">
              Nothing uploaded yet. Drop a photo above and it will show up here for next time.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => onPick(image.url)}
                  className="group overflow-hidden rounded-xl border border-caramel/22 bg-porcelain transition-all hover:-translate-y-1 hover:border-caramel hover:shadow-soft"
                >
                  <img
                    src={image.url}
                    alt={image.alt || image.filename}
                    className="h-28 w-full object-cover"
                    loading="lazy"
                  />
                  <p className="truncate px-2 py-1.5 text-left text-[0.68rem] text-cocoa/55">
                    {formatBytes(image.bytes)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
