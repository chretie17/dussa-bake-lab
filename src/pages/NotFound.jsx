import CreationArt from '../art/CreationArt'
import { Button } from '../components/ui'
import usePageMeta from '../lib/usePageMeta'

export default function NotFound() {
  usePageMeta({
    title: 'Page not found — Dussa BakeLab',
    description: 'That page has been eaten. Browse our creations instead.',
  })

  return (
    <section className="grain relative flex min-h-[80svh] items-center overflow-hidden bg-deep py-28 text-on-deep">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'var(--hero-glow)' }}
      />
      <div className="container-x relative z-10 text-center">
        <div className="mx-auto w-40 md:w-52">
          <CreationArt variant="cakeSlice" flavor="chocolate" seed="404" className="w-full" />
        </div>
        <p className="eyebrow mt-8 text-accent">Error 404</p>
        <h1 className="mt-5 text-[clamp(2.2rem,6vw,3.6rem)] leading-[1.05]">
          Someone ate this page
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[1.0625rem] leading-relaxed text-on-deep/60">
          We checked the shelf, the fridge, and the box marked “do not touch”. It is gone. Let us
          point you at something still warm.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button to="/creations" variant="gold" size="lg" sheen>
            Browse creations
          </Button>
          <Button
            to="/"
            size="lg"
            variant="outlineLight"
          >
            Back home
          </Button>
        </div>
      </div>
    </section>
  )
}
