import { ArrowRight, MessageCircle } from 'lucide-react'
import CreationArt from '../art/CreationArt'
import { Button, Reveal } from '../components/ui'
import { BRAND } from '../data/site'
import { whatsappEnquiryLink } from '../lib/orders'

export default function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-cream py-20 md:py-28">
      <div className="container-x">
        <Reveal>
          <div className="grain relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-deep-2 via-deep to-deep-3 px-7 py-16 text-center text-on-deep md:px-16 md:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/18 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-accent-soft/16 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="animate-drift pointer-events-none absolute -left-6 bottom-4 hidden w-32 opacity-70 md:block lg:w-40"
            >
              <CreationArt variant="cupcake" flavor="caramel" seed="cta-left" backdrop={false} className="w-full" />
            </div>
            <div
              aria-hidden="true"
              className="animate-drift pointer-events-none absolute -right-4 top-4 hidden w-32 opacity-70 [animation-delay:1.8s] md:block lg:w-40"
            >
              <CreationArt variant="donut" flavor="strawberry" seed="cta-right" backdrop={false} className="w-full" />
            </div>

            <div className="relative z-10">
              <p className="script text-[clamp(2rem,5vw,3rem)] leading-none text-accent">
                {BRAND.script}
              </p>
              <h2 className="mx-auto mt-6 max-w-2xl text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.1]">
                Tell us the date and we will{' '}
                <span className="italic text-gradient-gold">take it from there</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-on-deep/65">
                Two minutes to book. We come back to you with a price, and after that it is our
                problem until it reaches your table.
              </p>

              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Button to="/order" variant="gold" size="lg" sheen>
                  Start your order
                  <ArrowRight size={17} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
                <Button
                  href={whatsappEnquiryLink()}
                  size="lg"
                  variant="outlineLight"
                >
                  <MessageCircle size={17} strokeWidth={1.9} />
                  Chat on WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
