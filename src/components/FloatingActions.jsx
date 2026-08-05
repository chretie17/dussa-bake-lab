import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { WhatsAppIcon } from './BrandIcons'
import { whatsappEnquiryLink } from '../lib/orders'

/** Persistent WhatsApp hand-off plus a back-to-top button once you scroll. */
export default function FloatingActions() {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 print:hidden">
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-caramel/30 bg-porcelain text-espresso shadow-soft transition-colors hover:bg-blush"
            aria-label="Back to top"
          >
            <ArrowUp size={17} strokeWidth={1.8} />
          </motion.button>
        )}
      </AnimatePresence>

      <a
        href={whatsappEnquiryLink()}
        target="_blank"
        rel="noreferrer noopener"
        className="group flex items-center gap-2.5 rounded-full bg-[#25D366] py-3 pl-3.5 pr-4 text-white shadow-lift transition-transform duration-300 hover:scale-[1.03]"
        aria-label="Chat with Dussa BakeLab on WhatsApp"
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/40 [animation-duration:2.6s]" aria-hidden="true" />
          <WhatsAppIcon size={19} className="relative" />
        </span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-[0.8125rem] font-medium transition-all duration-400 group-hover:max-w-[7rem] md:max-w-[7rem]">
          Chat with us
        </span>
      </a>
    </div>
  )
}
