import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, Send, Stethoscope } from 'lucide-react'
import { TextInput } from '../Field'
import { checkWhatsApp, sendWhatsAppTest } from '../../lib/orders'
import { classNames } from '../../lib/format'

const TEMPLATES = [
  { id: 'customer', label: 'Order confirmation' },
  { id: 'status', label: 'Status update' },
  { id: '', label: 'Plain text' },
]

/**
 * Why WhatsApp is not delivering.
 *
 * Everything here comes from Meta rather than from us: whether the token is
 * alive, what the number is, whether each template exists under that exact name
 * and language, and how many parameters its body really takes. The test send is
 * the important half — it produces the actual rejection, in Meta's words,
 * instead of leaving you to guess from silence.
 */
export default function WhatsAppDoctor({ adminKey }) {
  const [checks, setChecks] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const [to, setTo] = useState('')
  const [template, setTemplate] = useState('customer')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const run = async () => {
    setRunning(true)
    setError('')
    try {
      const data = await checkWhatsApp(adminKey)
      setChecks(data.checks || [])
    } catch (err) {
      setError(err.message || 'Could not run the checks.')
    } finally {
      setRunning(false)
    }
  }

  const test = async () => {
    setSending(true)
    setResult(null)
    try {
      setResult(await sendWhatsAppTest(to, template, adminKey))
    } catch (err) {
      setResult({ ok: false, error: err.message || 'The test failed.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-caramel/22 bg-porcelain p-6">
      <h3 className="font-display text-[1.2rem] text-espresso">Why is WhatsApp not delivering?</h3>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-cocoa/65">
        This asks Meta directly rather than guessing. It checks your token, your number and both
        templates, then lets you send one real message and shows exactly what came back.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={running}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-espresso px-4 py-2.5 text-[0.85rem] font-medium text-cream transition-colors hover:bg-cocoa disabled:opacity-50"
      >
        {running ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Stethoscope size={15} strokeWidth={1.9} />
        )}
        {running ? 'Checking…' : 'Run the checks'}
      </button>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.85rem] text-red-800">
          {error}
        </p>
      )}

      {checks && (
        <div className="mt-5 space-y-3">
          {checks.map((check) => (
            <div
              key={check.id}
              className={classNames(
                'flex items-start gap-3 rounded-2xl border p-4',
                check.ok ? 'border-emerald-200 bg-emerald-50/60' : 'border-accent/45 bg-accent/12',
              )}
            >
              {check.ok ? (
                <CheckCircle2
                  size={18}
                  strokeWidth={1.8}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
              ) : (
                <AlertTriangle size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-caramel" />
              )}
              <div>
                <p className="text-[0.875rem] font-medium text-espresso">{check.label}</p>
                <p className="mt-1 text-[0.83rem] leading-relaxed text-cocoa/70">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------- test send */}
      <div className="mt-7 border-t border-caramel/20 pt-6">
        <h4 className="font-display text-[1.05rem] text-espresso">Send a test message</h4>
        <p className="mt-1.5 text-[0.85rem] leading-relaxed text-cocoa/65">
          Use your own number. Nothing is saved and no order is created.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1">
            <TextInput
              id="wa-test-to"
              type="tel"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="0788 722 064"
            />
          </div>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="rounded-xl border border-caramel/30 bg-porcelain px-3 py-3 text-[0.875rem] text-espresso"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={test}
            disabled={sending || !to.trim()}
            className="inline-flex items-center gap-2 rounded-xl border border-caramel/35 px-4 py-3 text-[0.85rem] font-medium text-espresso transition-colors hover:border-espresso disabled:opacity-50"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} strokeWidth={1.9} />}
            Send
          </button>
        </div>

        {result && (
          <div
            className={classNames(
              'mt-4 rounded-2xl border p-4 text-[0.85rem] leading-relaxed',
              result.ok
                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900',
            )}
          >
            {result.ok ? (
              <>
                <p className="font-medium">Meta accepted it, for {result.to}.</p>
                <p className="mt-1.5">{result.note}</p>
              </>
            ) : (
              <>
                <p className="font-medium">
                  Rejected{result.code ? ` — error ${result.code}` : ''}
                </p>
                <p className="mt-1.5">{result.error}</p>
                {result.detail && <p className="mt-1 opacity-80">{result.detail}</p>}
                {result.advice && (
                  <p className="mt-3 border-t border-red-200 pt-3 font-medium">{result.advice}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
