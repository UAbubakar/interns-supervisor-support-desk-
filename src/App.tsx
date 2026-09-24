          </div>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            {inOffice ? 'The supervisor is currently available for physical support at the office.' : 'The supervisor is currently working remotely. Remote matters can still be submitted for attention.'}
          </p>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6 md:border-l md:border-t-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Next physical availability</p>
          <p className="mt-3 text-lg font-bold text-slate-900">{nextOfficeDate ? formatOfficeDate(nextOfficeDate) : 'To be announced'}</p>
          <p className="mt-1 text-sm text-slate-500">Check this date before choosing physical handling.</p>
        </div>
      </div>
    </section>
  )
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-200 py-7 first:pt-0 last:border-0 last:pb-0">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{number}</span>
        <div>
          <h4 className="font-bold text-slate-900">{title}</h4>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {hint && <span className="ml-2 text-xs font-normal text-slate-400">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'violet' | 'amber' | 'blue' | 'orange' | 'green' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    orange: 'bg-orange-50 text-orange-700',
    green: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 h-2 w-8 rounded-full ${tones[tone].split(' ')[0]}`} />
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${tones[tone].split(' ')[1]}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: MatterStatus }) {
  const classes: Record<MatterStatus, string> = {
    Submitted: 'bg-violet-50 text-violet-700 ring-violet-200',
    Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    'In Progress': 'bg-blue-50 text-blue-700 ring-blue-200',
    Paused: 'bg-orange-50 text-orange-700 ring-orange-200',
    Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Unresolved: 'bg-red-50 text-red-700 ring-red-200',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${classes[status]}`}>{status}</span>
}

function HandlingBadge({ handling }: { handling: HandlingMethod }) {
  const classes: Record<HandlingMethod, string> = {
    Remote: 'bg-sky-50 text-sky-700 ring-sky-200',
    Physical: 'bg-orange-50 text-orange-700 ring-orange-200',
    'Either / Not Sure': 'bg-slate-100 text-slate-600 ring-slate-200',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${classes[handling]}`}>{handling}</span>
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-200 py-7 first:pt-0 last:border-0 last:pb-0">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{title}</h3>
      {children}
    </section>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatOfficeDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return 'To be announced'
  return formatLongDate(date)
}

function formatMatterId(matter: Pick<Matter, 'id' | 'submittedAt'>) {
  return formatMatterIdFromValues(matter.id, matter.submittedAt)
}

function formatMatterIdFromValues(id: number, submittedAt: number) {
  const date = new Date(submittedAt)
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const suffix = String(id).slice(-4)
  return `ISD-${yy}${mm}${dd}-${suffix}`
}

export default App
