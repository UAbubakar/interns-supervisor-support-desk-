import { useEffect, useMemo, useState, type ReactNode } from 'react'

type SupervisorStatus = 'In Office' | 'Working Remotely'
type InternType = 'University Intern' | 'NYSC Intern'
type HandlingMethod = 'Remote' | 'Physical' | 'Either / Not Sure'
type MatterStatus = 'Submitted' | 'Pending' | 'In Progress' | 'Paused' | 'Resolved' | 'Unresolved'
type ActiveView = 'intern' | 'supervisor'

type Matter = {
  id: number
  name: string
  email: string
  phone: string
  internType: InternType
  location: string
  matterType: string
  handling: HandlingMethod
  description: string
  status: MatterStatus
  submittedAt: number
  supervisorNote: string
  pauseReason: string
  historyVisibility: 'Public' | 'Private'
}

type DeskSettings = {
  supervisorStatus: SupervisorStatus
  nextOfficeDate: string
}

type FormState = {
  name: string
  email: string
  phone: string
  internType: InternType
  location: string
  otherLocation: string
  matterType: string
  otherMatterType: string
  handling: HandlingMethod
  description: string
}

const matterTypes = [
  'OnSite Booking Assistance',
  'OnSite Access',
  'Documentation — Remote Attention',
  'Documentation — Physical Attention Needed',
  'Project / Technical Support',
  'Schedule / Attendance',
  'Leave / Absence Matter',
  'Administrative Matter',
  'Career / Professional Guidance',
  'Meeting Request',
  'Approval / Authorization',
  'Task / Work Assignment',
  'Code Review',
  'Access / Account Issue',
  'Performance / Evaluation',
  'Internship / Programme Matter',
  'Other',
]

const pauseReasons = [
  'Waiting for information from intern',
  'Will continue during next physical visit',
  'Waiting for information / approval from above',
  'Deferred',
]

const matterStatuses: MatterStatus[] = [
  'Submitted',
  'Pending',
  'In Progress',
  'Paused',
  'Resolved',
  'Unresolved',
]

const STORAGE_KEY = 'intern-supervisor-support-desk-matters'
const SETTINGS_KEY = 'intern-supervisor-support-desk-settings'

const initialForm: FormState = {
  name: '',
  email: '',
  phone: '',
  internType: 'University Intern',
  location: 'Abuja',
  otherLocation: '',
  matterType: matterTypes[0],
  otherMatterType: '',
  handling: 'Either / Not Sure',
  description: '',
}

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('intern')
  const [supervisorStatus, setSupervisorStatus] = useState<SupervisorStatus>('Working Remotely')
  const [nextOfficeDate, setNextOfficeDate] = useState('')
  const [matters, setMatters] = useState<Matter[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | MatterStatus>('All')
  const [handlingFilter, setHandlingFilter] = useState<'All' | HandlingMethod>('All')
  const [storageLoaded, setStorageLoaded] = useState(false)
  const [selectedMatterId, setSelectedMatterId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [noteDraft, setNoteDraft] = useState('')
  const [pauseReasonDraft, setPauseReasonDraft] = useState('')
  const [submissionSuccess, setSubmissionSuccess] = useState<number | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const savedMatters = window.localStorage.getItem(STORAGE_KEY)
    const savedSettings = window.localStorage.getItem(SETTINGS_KEY)

    if (savedMatters) {
      try {
        setMatters(JSON.parse(savedMatters) as Matter[])
      } catch (error) {
        console.error('Could not load saved matters:', error)
      }
    }

    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings) as Partial<DeskSettings>
        if (settings.supervisorStatus) setSupervisorStatus(settings.supervisorStatus)
        if (typeof settings.nextOfficeDate === 'string') setNextOfficeDate(settings.nextOfficeDate)
      } catch (error) {
        console.error('Could not load desk settings:', error)
      }
    }

    setStorageLoaded(true)
  }, [])

  useEffect(() => {
    if (!storageLoaded) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(matters))
  }, [matters, storageLoaded])

  useEffect(() => {
    if (!storageLoaded) return
    const settings: DeskSettings = { supervisorStatus, nextOfficeDate }
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [supervisorStatus, nextOfficeDate, storageLoaded])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const selectedMatter = useMemo(
    () => matters.find((matter) => matter.id === selectedMatterId) ?? null,
    [matters, selectedMatterId],
  )

  const filteredMatters = useMemo(() => {
    const search = searchTerm.toLowerCase().trim()

    return matters.filter((matter) => {
      const matchesSearch =
        !search ||
        matter.name.toLowerCase().includes(search) ||
        matter.email.toLowerCase().includes(search) ||
        matter.matterType.toLowerCase().includes(search) ||
        matter.location.toLowerCase().includes(search) ||
        formatMatterId(matter).toLowerCase().includes(search) ||
        String(matter.id).includes(search)

      const matchesStatus = statusFilter === 'All' || matter.status === statusFilter
      const matchesHandling = handlingFilter === 'All' || matter.handling === handlingFilter
      return matchesSearch && matchesStatus && matchesHandling
    })
  }, [matters, searchTerm, statusFilter, handlingFilter])

  const counts = useMemo(() => {
    const count = (status: MatterStatus) => matters.filter((matter) => matter.status === status).length
    return {
      total: matters.length,
      submitted: count('Submitted'),
      pending: count('Pending'),
      inProgress: count('In Progress'),
      paused: count('Paused'),
      resolved: count('Resolved'),
    }
  }, [matters])

  const handleFormChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => setForm(initialForm)

  const submitMatter = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.description.trim()) {
      setNotice('Please complete all required fields.')
      return
    }

    if (form.location === 'Other' && !form.otherLocation.trim()) {
      setNotice('Please specify the office location.')
      return
    }

    if (form.matterType === 'Other' && !form.otherMatterType.trim()) {
      setNotice('Please specify the matter type.')
      return
    }

    const newMatter: Matter = {
      id: Date.now(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      internType: form.internType,
      location: form.location === 'Other' ? form.otherLocation.trim() : form.location,
      matterType: form.matterType === 'Other' ? form.otherMatterType.trim() : form.matterType,
      handling: form.handling,
      description: form.description.trim(),
      status: 'Submitted',
      submittedAt: Date.now(),
      supervisorNote: '',
      pauseReason: '',
      historyVisibility: 'Private',
    }

    setMatters((current) => [newMatter, ...current])
    setSubmissionSuccess(newMatter.id)
    resetForm()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updateMatter = (id: number, updates: Partial<Matter>) => {
    setMatters((current) =>
      current.map((matter) => (matter.id === id ? { ...matter, ...updates } : matter)),
    )
  }

  const openMatter = (matter: Matter) => {
    setSelectedMatterId(matter.id)
    setNoteDraft(matter.supervisorNote)
    setPauseReasonDraft(matter.pauseReason)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeMatter = () => {
    setSelectedMatterId(null)
    setNoteDraft('')
    setPauseReasonDraft('')
  }

  const changeStatus = (status: MatterStatus) => {
    if (!selectedMatter) return
    updateMatter(selectedMatter.id, {
      status,
      pauseReason: status === 'Paused' ? selectedMatter.pauseReason : '',
    })
    if (status !== 'Paused') setPauseReasonDraft('')
    setNotice(`Matter moved to ${status}.`)
  }

  const saveSupervisorNote = () => {
    if (!selectedMatter) return
    updateMatter(selectedMatter.id, { supervisorNote: noteDraft.trim() })
    setNotice('Supervisor note saved.')
  }

  const savePauseReason = () => {
    if (!selectedMatter) return
    if (!pauseReasonDraft) {
      setNotice('Select a pause reason before saving.')
      return
    }
    updateMatter(selectedMatter.id, { pauseReason: pauseReasonDraft, status: 'Paused' })
    setNotice('Pause reason saved.')
  }

  const clearAllMatters = () => {
    if (matters.length === 0) return
    const confirmed = window.confirm('Clear all submitted matters? This cannot be undone.')
    if (confirmed) {
      setMatters([])
      closeMatter()
      setNotice('All matters cleared.')
    }
  }

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter('All')
    setHandlingFilter('All')
  }

  const switchView = (view: ActiveView) => {
    setActiveView(view)
    closeMatter()
    setSubmissionSuccess(null)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {notice && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg">
          {notice}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 text-white shadow-lg shadow-slate-900/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm ring-1 ring-white/10">
              IS
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
                Interns Supervisor Support Desk
              </h1>
              <p className="hidden text-xs text-slate-300 sm:block">Intern support and matter management</p>
            </div>
          </div>

          <div className="flex shrink-0 rounded-xl border border-slate-700 bg-slate-900 p-1">
            {(['intern', 'supervisor'] as ActiveView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => switchView(view)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition sm:px-4 sm:text-sm ${
                  activeView === view
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {activeView === 'intern' ? (
          <InternView
            supervisorStatus={supervisorStatus}
            nextOfficeDate={nextOfficeDate}
            form={form}
            handleFormChange={handleFormChange}
            submitMatter={submitMatter}
            submissionSuccess={submissionSuccess}
            setSubmissionSuccess={setSubmissionSuccess}
          />
        ) : selectedMatter ? (
          <MatterDetail
            matter={selectedMatter}
            noteDraft={noteDraft}
            pauseReasonDraft={pauseReasonDraft}
            setNoteDraft={setNoteDraft}
            setPauseReasonDraft={setPauseReasonDraft}
            changeStatus={changeStatus}
            saveSupervisorNote={saveSupervisorNote}
            savePauseReason={savePauseReason}
            closeMatter={closeMatter}
          />
        ) : (
          <SupervisorView
            supervisorStatus={supervisorStatus}
            setSupervisorStatus={setSupervisorStatus}
            nextOfficeDate={nextOfficeDate}
            setNextOfficeDate={setNextOfficeDate}
            counts={counts}
            matters={matters}
            filteredMatters={filteredMatters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            handlingFilter={handlingFilter}
            setHandlingFilter={setHandlingFilter}
            openMatter={openMatter}
            clearAllMatters={clearAllMatters}
            resetFilters={resetFilters}
          />
        )}
      </main>

      <footer className="border-t border-slate-300 bg-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6 text-xs text-slate-400 sm:px-6 lg:px-8">
          <p className="font-medium text-slate-500">Interns Supervisor Support Desk</p>
          <p>Designed to keep intern requests clear, traceable and easy to manage.</p>
        </div>
      </footer>
    </div>
  )
}

type InternViewProps = {
  supervisorStatus: SupervisorStatus
  nextOfficeDate: string
  form: FormState
  handleFormChange: <K extends keyof FormState>(field: K, value: FormState[K]) => void
  submitMatter: () => void
  submissionSuccess: number | null
  setSubmissionSuccess: (id: number | null) => void
}

function InternView({
  supervisorStatus,
  nextOfficeDate,
  form,
  handleFormChange,
  submitMatter,
  submissionSuccess,
  setSubmissionSuccess,
}: InternViewProps) {
  return (
    <div className="space-y-8">
      <section>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Intern support</span>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Get the right support, without the back-and-forth.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Check your supervisor&apos;s availability, submit a matter, and provide the details needed for efficient follow-up.
        </p>
      </section>

      <AvailabilityCard supervisorStatus={supervisorStatus} nextOfficeDate={nextOfficeDate} />

      {submissionSuccess && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-900">Matter submitted successfully</p>
              <p className="mt-1 text-sm leading-6 text-emerald-800">
                Your reference is <strong>{formatMatterIdFromValues(submissionSuccess, submissionSuccess)}</strong>. Keep it for follow-up.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubmissionSuccess(null)}
              className="self-start rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/60 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-800">01</div>
            <div>
              <h3 className="text-lg font-bold text-slate-950">Submit a matter</h3>
              <p className="mt-1 text-sm text-slate-500">Fields marked with * are required.</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            submitMatter()
          }}
          className="p-5 sm:p-7"
        >
          <FormSection number="1" title="Your information" description="Tell us who you are and where you are working from.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full Name *">
                <input
                  required
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => handleFormChange('name', event.target.value)}
                  className={inputClass}
                  placeholder="Your full name"
                />
              </Field>
              <Field label="Intern Type *">
                <select
                  value={form.internType}
                  onChange={(event) => handleFormChange('internType', event.target.value as InternType)}
                  className={inputClass}
                >
                  <option>University Intern</option>
                  <option>NYSC Intern</option>
                </select>
              </Field>
              <Field label="Email *">
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => handleFormChange('email', event.target.value)}
                  className={inputClass}
                  placeholder="your@email.com"
                />
              </Field>
              <Field label="Phone Number *">
                <input
                  required
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => handleFormChange('phone', event.target.value)}
                  className={inputClass}
                  placeholder="e.g. 0801 234 5678"
                />
              </Field>
              <Field label="Office Location *">
                <select value={form.location} onChange={(event) => handleFormChange('location', event.target.value)} className={inputClass}>
                  <option>Abuja</option>
                  <option>Kaduna</option>
                  <option>Other</option>
                </select>
              </Field>
              {form.location === 'Other' && (
                <Field label="Specify Location *">
                  <input
                    required
                    value={form.otherLocation}
                    onChange={(event) => handleFormChange('otherLocation', event.target.value)}
                    className={inputClass}
                    placeholder="Enter office location"
                  />
                </Field>
              )}
            </div>
          </FormSection>

          <FormSection number="2" title="Matter details" description="Give the supervisor enough context to understand what you need.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Matter Type *">
                <select value={form.matterType} onChange={(event) => handleFormChange('matterType', event.target.value)} className={inputClass}>
                  {matterTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </Field>
              <Field label="Preferred Handling *">
                <select
                  value={form.handling}
                  onChange={(event) => handleFormChange('handling', event.target.value as HandlingMethod)}
                  className={inputClass}
                >
                  <option>Remote</option>
                  <option>Physical</option>
                  <option>Either / Not Sure</option>
                </select>
              </Field>
              {form.matterType === 'Other' && (
                <div className="md:col-span-2">
                  <Field label="Specify Matter Type *">
                    <input
                      required
                      value={form.otherMatterType}
                      onChange={(event) => handleFormChange('otherMatterType', event.target.value)}
                      className={inputClass}
                      placeholder="Describe the matter type"
                    />
                  </Field>
                </div>
              )}
              <div className="md:col-span-2">
                <Field label="Describe the Matter *" hint="Include relevant context, what you have tried, and the outcome you need.">
                  <textarea
                    required
                    value={form.description}
                    onChange={(event) => handleFormChange('description', event.target.value)}
                    rows={6}
                    maxLength={2000}
                    className={`${inputClass} resize-y`}
                    placeholder="Briefly explain the issue or request..."
                  />
                  <p className="mt-2 text-right text-xs text-slate-400">{form.description.length}/2000</p>
                </Field>
              </div>
            </div>
          </FormSection>

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-xs leading-5 text-slate-500">
              Please review your contact details before submitting so the supervisor can reach you if clarification is needed.
            </p>
            <button type="submit" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100">
              Submit Matter →
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

type SupervisorViewProps = {
  supervisorStatus: SupervisorStatus
  setSupervisorStatus: (status: SupervisorStatus) => void
  nextOfficeDate: string
  setNextOfficeDate: (date: string) => void
  counts: { total: number; submitted: number; pending: number; inProgress: number; paused: number; resolved: number }
  matters: Matter[]
  filteredMatters: Matter[]
  searchTerm: string
  setSearchTerm: (value: string) => void
  statusFilter: 'All' | MatterStatus
  setStatusFilter: (value: 'All' | MatterStatus) => void
  handlingFilter: 'All' | HandlingMethod
  setHandlingFilter: (value: 'All' | HandlingMethod) => void
  openMatter: (matter: Matter) => void
  clearAllMatters: () => void
  resetFilters: () => void
}

function SupervisorView(props: SupervisorViewProps) {
  const {
    supervisorStatus, setSupervisorStatus, nextOfficeDate, setNextOfficeDate, counts, matters, filteredMatters,
    searchTerm, setSearchTerm, statusFilter, setStatusFilter, handlingFilter, setHandlingFilter,
    openMatter, clearAllMatters, resetFilters,
  } = props

  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'All' || handlingFilter !== 'All'

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Supervisor workspace</span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Support operations</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Manage availability, triage new matters, and keep requests moving.</p>
        </div>
        <div className="text-sm text-slate-500">{formatLongDate(new Date())}</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Current availability</p>
            <div className="mt-2 flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${supervisorStatus === 'In Office' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
              <h3 className="text-xl font-bold text-slate-950">{supervisorStatus}</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">This status is shown to interns on the submission page.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[560px]">
            <div className="rounded-xl bg-slate-50 p-3">
              <label className="mb-2 block text-xs font-semibold text-slate-500">Working mode</label>
              <div className="grid grid-cols-2 gap-2">
                {(['In Office', 'Working Remotely'] as SupervisorStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSupervisorStatus(status)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                      supervisorStatus === status ? 'bg-blue-900 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <label htmlFor="next-office-date" className="mb-2 block text-xs font-semibold text-slate-500">Next physical office date</label>
              <input
                id="next-office-date"
                type="date"
                value={nextOfficeDate}
                onChange={(event) => setNextOfficeDate(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total" value={counts.total} tone="slate" />
        <StatCard label="New" value={counts.submitted} tone="violet" />
        <StatCard label="Pending" value={counts.pending} tone="amber" />
        <StatCard label="In Progress" value={counts.inProgress} tone="blue" />
        <StatCard label="Paused" value={counts.paused} tone="orange" />
        <StatCard label="Resolved" value={counts.resolved} tone="green" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-950">Matter queue</h3>
              <p className="mt-1 text-sm text-slate-500">
                {filteredMatters.length} {filteredMatters.length === 1 ? 'matter' : 'matters'} shown
                {hasActiveFilters ? ` of ${matters.length}` : ''}.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, email, type or ID..."
                className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 sm:w-72"
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | MatterStatus)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-600">
                <option value="All">All statuses</option>
                {matterStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <select value={handlingFilter} onChange={(event) => setHandlingFilter(event.target.value as 'All' | HandlingMethod)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-600">
                <option value="All">All handling</option>
                <option value="Remote">Remote</option>
                <option value="Physical">Physical</option>
                <option value="Either / Not Sure">Either / Not Sure</option>
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <button type="button" onClick={resetFilters} className="mt-3 text-xs font-bold text-blue-700 hover:text-blue-800">Clear filters</button>
          )}
        </div>

        {filteredMatters.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">{matters.length === 0 ? '✓' : '⌕'}</div>
            <p className="mt-4 font-bold text-slate-800">{matters.length === 0 ? 'No matters submitted yet' : 'No matching matters'}</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              {matters.length === 0 ? 'New intern submissions will appear here automatically.' : 'Try changing your search term or filters.'}
            </p>
            {hasActiveFilters && <button type="button" onClick={resetFilters} className="mt-4 rounded-lg bg-blue-900 px-4 py-2 text-xs font-bold text-white">Reset filters</button>}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMatters.map((matter) => (
              <button key={matter.id} type="button" onClick={() => openMatter(matter)} className="group block w-full px-5 py-5 text-left transition hover:bg-slate-50 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{formatMatterId(matter)}</span>
                      <StatusBadge status={matter.status} />
                      <HandlingBadge handling={matter.handling} />
                    </div>
                    <h4 className="mt-3 truncate text-base font-bold text-slate-900 group-hover:text-blue-800">{matter.matterType}</h4>
                    <p className="mt-1 text-sm font-medium text-slate-600">{matter.name} <span className="font-normal text-slate-400">· {matter.internType} · {matter.location}</span></p>
                    <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">{matter.description}</p>
                  </div>
                  <div className="shrink-0 text-left lg:text-right">
                    <p className="text-xs font-medium text-slate-400">{formatDate(matter.submittedAt)}</p>
                    <p className="mt-2 text-xs font-bold text-blue-700 opacity-0 transition group-hover:opacity-100">Open matter →</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {matters.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-right sm:px-6">
            <button type="button" onClick={clearAllMatters} className="text-xs font-semibold text-red-600 hover:text-red-700">Clear all matters</button>
          </div>
        )}
      </section>
    </div>
  )
}

type MatterDetailProps = {
  matter: Matter
  noteDraft: string
  pauseReasonDraft: string
  setNoteDraft: (value: string) => void
  setPauseReasonDraft: (value: string) => void
  changeStatus: (status: MatterStatus) => void
  saveSupervisorNote: () => void
  savePauseReason: () => void
  closeMatter: () => void
}

function MatterDetail({ matter, noteDraft, pauseReasonDraft, setNoteDraft, setPauseReasonDraft, changeStatus, saveSupervisorNote, savePauseReason, closeMatter }: MatterDetailProps) {
  return (
    <div className="space-y-6">
      <button type="button" onClick={closeMatter} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900">← Back to matter queue</button>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-500">{formatMatterId(matter)}</span>
                <StatusBadge status={matter.status} />
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{matter.matterType}</h2>
              <p className="mt-2 text-sm text-slate-500">Submitted by <strong className="text-slate-700">{matter.name}</strong> · {formatDate(matter.submittedAt)}</p>
            </div>
            <HandlingBadge handling={matter.handling} />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px]">
          <div className="p-5 sm:p-7 lg:border-r lg:border-slate-200">
            <DetailSection title="Matter description">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{matter.description}</p>
            </DetailSection>

            <DetailSection title="Intern details">
              <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                <DetailItem label="Full name" value={matter.name} />
                <DetailItem label="Intern type" value={matter.internType} />
                <DetailItem label="Email" value={matter.email} />
                <DetailItem label="Phone" value={matter.phone} />
                <DetailItem label="Office location" value={matter.location} />
                <DetailItem label="Preferred handling" value={matter.handling} />
              </div>
            </DetailSection>

            {matter.pauseReason && (
              <div className="mt-7 rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-700">Pause reason</p>
                <p className="mt-1 text-sm font-medium text-orange-900">{matter.pauseReason}</p>
              </div>
            )}
          </div>

          <aside className="bg-slate-50/70 p-5 sm:p-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Matter status</label>
              <select value={matter.status} onChange={(event) => changeStatus(event.target.value as MatterStatus)} className={`${inputClass} mt-2 bg-white`}>
                {matterStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>

            {matter.status === 'Paused' && (
              <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
                <label className="text-xs font-bold uppercase tracking-wide text-orange-800">Pause reason</label>
                <select value={pauseReasonDraft} onChange={(event) => setPauseReasonDraft(event.target.value)} className="mt-2 w-full rounded-lg border border-orange-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-4 focus:ring-orange-100">
                  <option value="">Select a reason</option>
                  {pauseReasons.map((reason) => <option key={reason}>{reason}</option>)}
                </select>
                <button type="button" onClick={savePauseReason} className="mt-3 w-full rounded-lg bg-orange-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-orange-700">Save pause reason</button>
              </div>
            )}

            <div className="mt-6 border-t border-slate-200 pt-6">
              <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Supervisor note</label>
              <p className="mt-1 text-xs leading-5 text-slate-500">Internal note for follow-up and context.</p>
              <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} rows={7} className={`${inputClass} mt-3 resize-y bg-white`} placeholder="Add an internal note about this matter..." />
              <button type="button" onClick={saveSupervisorNote} className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800">Save note</button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

function AvailabilityCard({ supervisorStatus, nextOfficeDate }: { supervisorStatus: SupervisorStatus; nextOfficeDate: string }) {
  const inOffice = supervisorStatus === 'In Office'
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid md:grid-cols-[1.4fr_1fr]">
        <div className="p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Supervisor availability</p>
          <div className="mt-3 flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ring-4 ${inOffice ? 'bg-emerald-500 ring-emerald-50' : 'bg-sky-500 ring-sky-50'}`} />
            <h3 className="text-2xl font-bold text-slate-950">{supervisorStatus}</h3>
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
