import { Clock, MapPin, Truck, Wallet } from "lucide-react";
import { Button, Reveal } from "../components/ui";
import { useCatalog } from "../context/CatalogContext";
import { whatsappEnquiryLink } from "../lib/orders";
import { money } from "../lib/format";

function buildCards(fulfilment) {
  return [
    {
      icon: Clock,
      label: "Lead time",
      title: `${fulfilment.leadDays?.standard ?? 2} days for most orders`,
      body: `Custom designs need ${fulfilment.leadDays?.custom ?? 4} days, wedding tiers ${fulfilment.leadDays?.wedding ?? 14}. Rush slots open weekly.`,
      tint: "bg-blush text-choco",
    },
    {
      icon: MapPin,
      label: "Collection",
      title: "Pick up in Kigali",
      body: "Pick a time at checkout and collect it boxed, cold and ready to travel.",
      tint: "bg-gold/22 text-mocha",
    },
    {
      icon: Truck,
      label: "Delivery",
      title: `${money(fulfilment.deliveryFee)} citywide`,
      body: `Free over ${money(fulfilment.freeDeliveryOver)}. Kept cold on the way, across every zone in the city.`,
      tint: "bg-caramel/18 text-choco",
    },
    {
      icon: Wallet,
      label: "Payment",
      title: "MoMo, Airtel, bank or cash",
      body: `Normal orders are paid on delivery. Custom work needs a ${fulfilment.depositPercent}% deposit to hold the date.`,
      tint: "bg-espresso/8 text-espresso",
    },
  ];
}

/** The practical answers people scan for before they commit to ordering. */
export default function InfoCards() {
  const { fulfilment, contact } = useCatalog();
  const cards = buildCards(fulfilment);

  return (
    <section className="relative bg-cream pb-20 pt-4 md:pb-28">
      <div className="container-x">
        <Reveal>
          <div className="grid divide-y divide-caramel/18 overflow-hidden rounded-[1.75rem] border border-caramel/22 bg-porcelain shadow-soft sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="group relative p-7 transition-colors duration-400 hover:bg-cream/70 sm:border-b sm:border-caramel/18 lg:border-b-0"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.tint} transition-transform duration-400 group-hover:scale-110`}
                  >
                    <Icon size={19} strokeWidth={1.7} />
                  </div>
                  <p className="eyebrow mt-5 text-caramel">{card.label}</p>
                  <h3 className="mt-2 font-display text-[1.15rem] leading-snug text-espresso">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-[0.85rem] leading-relaxed text-cocoa/62">
                    {card.body}
                  </p>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button to="/order" size="lg" sheen>
              Book your order
            </Button>
            <Button href={whatsappEnquiryLink()} size="lg" variant="outline">
              Ask on WhatsApp
            </Button>
            <Button
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.mapQuery || contact.location)}`}
              size="lg"
              variant="ghost"
            >
              Find us in Kigali
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
