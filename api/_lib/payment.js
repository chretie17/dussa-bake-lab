/**
 * Payment state on an order.
 *
 * The flow is deliberately two-handed. A customer telling us they have paid
 * only ever records a *claim* — anybody can type "PAID" — and the order does
 * not move until someone at the bakery has looked at the proof and verified
 * it. Nothing here ever confirms an order by itself.
 */

export const PAYMENT_STATUSES = ['unpaid', 'claimed', 'verified']

/** Proof screenshots are ids in the images table, prefixed so they can be
 *  told apart from product photos and served under the admin key instead. */
export const PROOF_PREFIX = 'pay'

export function isProofId(id) {
  return /^pay[a-z0-9]+(\.[a-z0-9]+)?$/i.test(String(id || ''))
}

export function newProofId(mime) {
  const ext = String(mime || '').includes('png') ? 'png' : 'jpg'
  const random = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
  return `${PROOF_PREFIX}${random}.${ext}`
}

export function emptyPayment() {
  return { status: 'unpaid' }
}

/**
 * Does this message read as "I have paid"?
 *
 * Kinyarwanda and French are in here because plenty of customers in Kigali
 * will answer in one of them rather than the English we asked for.
 */
export function looksLikePaymentClaim(text) {
  // Accents are stripped first so "payé" and "paye" are the same word here —
  // \b does not treat é as a letter, so matching it directly silently fails.
  const value = String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
  if (!value) return false

  return /\b(paid|payed|paye|payment|nishyuye|nayohereje|noherejwe|kwishyura|nagusize|virement|done|sent)\b/.test(
    value,
  )
}

/** Normalises whatever the admin sent into a payment block we will store. */
export function sanitisePayment(input, current = {}) {
  const next = { ...emptyPayment(), ...current }

  const status = typeof input === 'string' ? input : input?.status
  if (status && PAYMENT_STATUSES.includes(status)) {
    next.status = status
    const now = new Date().toISOString()
    if (status === 'claimed' && !next.claimedAt) next.claimedAt = now
    if (status === 'verified') next.verifiedAt = now
    if (status === 'unpaid') {
      // Rejecting a claim clears the trail, so the customer can try again.
      delete next.claimedAt
      delete next.verifiedAt
      delete next.reference
      delete next.proofImageId
    }
  }

  if (typeof input === 'object' && input) {
    if (typeof input.reference === 'string') next.reference = input.reference.slice(0, 300)
    if (typeof input.note === 'string') next.note = input.note.slice(0, 300)
  }

  return next
}

/** Records a customer saying they have paid. Never moves the order status. */
export function claimPayment(payment, { reference, proofImageId } = {}) {
  const now = new Date().toISOString()
  const next = { ...emptyPayment(), ...payment }

  // A verified payment is final — a later message must not undo it.
  if (next.status === 'verified') return next

  next.status = 'claimed'
  next.claimedAt = next.claimedAt || now
  next.lastMessageAt = now
  if (reference) next.reference = String(reference).slice(0, 300)
  if (proofImageId) next.proofImageId = proofImageId
  return next
}

export function paymentLabel(payment) {
  switch (payment?.status) {
    case 'verified':
      return 'Payment verified'
    case 'claimed':
      return payment.proofImageId
        ? 'Payment reported, screenshot attached'
        : 'Payment reported, no screenshot yet'
    default:
      return 'Awaiting payment'
  }
}
