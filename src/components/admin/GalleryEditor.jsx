import { useEffect, useRef, useState } from 'react'
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'
import { MediaModal } from './ImagePicker'
import { TextInput } from '../Field'
import { ACCEPTED, listImages, uploadImage } from '../../lib/images'

/**
 * Picks the photos for the moving shelf on the home page. Leave it empty and
 * the drawings are used instead, so the strip is never blank.
 */
export default function GalleryEditor({ rows = [], onChange, adminKey }) {
  const [library, setLibrary] = useState([])
  const [picking, setPicking] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!picking) return
    listImages(adminKey)
      .then(setLibrary)
      .catch((e) => setError(e.message))
  }, [picking, adminKey])

  const add = (url) => onChange([...rows, { url, caption: '' }])

  const upload = async (files) => {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const image = await uploadImage(file, adminKey)
      add(image.url)
    } catch (e) {
      setError(e.message || 'That upload did not work.')
    } finally {
      setUploading(false)
    }
  }

  const update = (index, key, value) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)))

  const remove = (index) => onChange(rows.filter((_, i) => i !== index))

  return (
    <div>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-caramel/30 bg-cream/50 px-4 py-3 text-[0.8rem] text-cocoa/60">
          No gallery photos selected. The home page currently shows example photos. Add your own bakery photos here.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row, index) => (
            <li
              key={index}
              className="overflow-hidden rounded-xl border border-caramel/22 bg-cream/50"
            >
              <img
                src={row.url}
                alt=""
                className="h-28 w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.opacity = '0.25'
                }}
              />
              <div className="space-y-2 p-2.5">
                <TextInput
                  value={row.caption || ''}
                  onChange={(e) => update(index, 'caption', e.target.value)}
                  placeholder="Caption, e.g. Red velvet · birthday"
                  className="h-9 text-[0.8rem]"
                  aria-label={`Caption for gallery photo ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-caramel/25 py-1.5 text-[0.72rem] text-cocoa/70 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2.5 text-[0.78rem] text-red-700">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-full border border-caramel/30 px-3.5 py-1.5 text-[0.78rem] font-medium text-cocoa transition-colors hover:border-caramel hover:bg-blush/50 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          Upload a photo
        </button>
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-caramel/30 px-3.5 py-1.5 text-[0.78rem] font-medium text-cocoa transition-colors hover:border-caramel hover:bg-blush/50"
        >
          <ImageIcon size={13} /> Choose one you already have
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={(e) => upload(e.target.files)}
      />

      {picking && (
        <MediaModal
          images={library}
          onPick={(url) => {
            add(url)
            setPicking(false)
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  )
}
