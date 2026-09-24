import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

type SupervisorStatus = 'In Office' | 'Working Remotely'

type InternType = 'University Intern' | 'NYSC Intern'

type HandlingMethod = 'Remote' | 'Physical' | 'Either / Not Sure'

type MatterStatus =
  | 'Submitted'
  | 'Pending'
  | 'In Progress'
  | 'Paused'
  | 'Resolved'
  | 'Unresolved'

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

const STORAGE_KEY = 'intern-supervisor-support-desk-matters'

// ========================================
// Styled Component
// ========================================

/*
const StatusBadge = styled.span<{ status: MatterStatus }>`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;

  background: ${(props) => {
    switch (props.status) {
      case 'Submitted':
        return '#f3e8ff'
      case 'Pending':
        return '#fef3c7'
      case 'In Progress':
        return '#dbeafe'
      case 'Paused':
        return '#ffedd5'
      case 'Resolved':
        return '#dcfce7'
      case 'Unresolved':
        return '#fee2e2'
    }
  }}

  color: ${(props) => {
    switch (props.status) {
      case 'Submitted':
        return '#7e22ce'
      case 'Pending':
        return '#b45309'
      case 'In Progress':
        return '#2563eb'
      case 'Paused':
        return '#c2410c'
      case 'Resolved':
        return '#15803d'
      case 'Unresolved':
        return '#b91c1c'
    }
  }}
`
*/

function App() {
  const [supervisorStatus, setSupervisorStatus] =
    useState<SupervisorStatus>('Working Remotely')

  /*
    const [nextOfficeDate, setNextOfficeDate] =
    useState('2026-08-24')
  */
 
  const [activeView, setActiveView] =
    useState<'intern' | 'supervisor'>('intern')

  const [matters, setMatters] = useState<Matter[]>([])

  const [searchTerm, setSearchTerm] = useState('')

  const [statusFilter, setStatusFilter] =
    useState<'All' | MatterStatus>('All')

  const [handlingFilter, setHandlingFilter] =
    useState<'All' | HandlingMethod>('All')

  const [storageLoaded, setStorageLoaded] = useState(false)

  const [selectedMatterId, setSelectedMatterId] =
    useState<number | null>(null)



  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    internType: 'University Intern' as InternType,
    location: 'Abuja',
    otherLocation: '',
    matterType: matterTypes[0],
    otherMatterType: '',
    handling: 'Either / Not Sure' as HandlingMethod,
    description: '',
  })

  const [noteDraft, setNoteDraft] = useState('')
  const [pauseReasonDraft, setPauseReasonDraft] = useState('')

  // Load saved matters
useEffect(() => {
  const saved = window.localStorage.getItem(STORAGE_KEY)

  if (saved) {
    try {
      const parsed: Matter[] = JSON.parse(saved)
      setMatters(parsed)
    } catch (error) {
      console.error('Could not load saved matters:', error)
    }
  }

  setStorageLoaded(true)
}, [])

// Save only after the initial load has completed
useEffect(() => {
  if (!storageLoaded) {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(matters)
  )
}, [matters, storageLoaded])
  const selectedMatter = useMemo(
    () => matters.find((matter) => matter.id === selectedMatterId) ?? null,
    [matters, selectedMatterId]
  )

  const filteredMatters = useMemo(() => {
  return matters.filter((matter) => {
    const search = searchTerm.toLowerCase().trim()

    const matchesSearch =
      !search ||
      matter.name.toLowerCase().includes(search) ||
      matter.email.toLowerCase().includes(search) ||
      matter.matterType.toLowerCase().includes(search) ||
      matter.location.toLowerCase().includes(search) ||
      String(matter.id).includes(search)

    const matchesStatus =
      statusFilter === 'All' ||
      matter.status === statusFilter

    const matchesHandling =
      handlingFilter === 'All' ||
      matter.handling === handlingFilter

    return (
      matchesSearch &&
      matchesStatus &&
      matchesHandling
    )
  })
}, [
  matters,
  searchTerm,
  statusFilter,
  handlingFilter,
])


  const handleFormChange = (
    field: string,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const resetForm = () => {
    setForm({
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
    })
  }

  const submitMatter = () => {
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.description.trim()
    ) {
      alert('Please complete all required fields.')
      return
    }

    if (
      form.location === 'Other' &&
      !form.otherLocation.trim()
    ) {
      alert('Please specify the office location.')
      return
    }

    if (
      form.matterType === 'Other' &&
      !form.otherMatterType.trim()
    ) {
      alert('Please specify the matter type.')
      return
    }

    const newMatter: Matter = {
      id: Date.now(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      internType: form.internType,
      location:
        form.location === 'Other'
          ? form.otherLocation.trim()
          : form.location,
      matterType:
        form.matterType === 'Other'
          ? form.otherMatterType.trim()
          : form.matterType,
      handling: form.handling,
      description: form.description.trim(),
      status: 'Submitted',
      submittedAt: Date.now(),
      supervisorNote: '',
      pauseReason: '',
      historyVisibility: 'Private',
    }

    setMatters((current) => [
      newMatter,
      ...current,
    ])

    resetForm()

    alert('Matter submitted successfully.')
  }

  const updateMatter = (
    id: number,
    updates: Partial<Matter>
  ) => {
    setMatters((current) =>
      current.map((matter) =>
        matter.id === id
          ? { ...matter, ...updates }
          : matter
      )
    )
  }

  const openMatter = (matter: Matter) => {
    setSelectedMatterId(matter.id)
    setNoteDraft(matter.supervisorNote)
    setPauseReasonDraft(matter.pauseReason)
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
      pauseReason:
        status === 'Paused'
          ? pauseReasonDraft
          : '',
    })
  }

  const saveSupervisorNote = () => {
    if (!selectedMatter) return

    updateMatter(selectedMatter.id, {
      supervisorNote: noteDraft.trim(),
    })

    alert('Supervisor note saved.')
  }

  const savePauseReason = () => {
    if (!selectedMatter) return

    updateMatter(selectedMatter.id, {
      pauseReason: pauseReasonDraft,
    })

    alert('Pause reason saved.')
  }

  const clearAllMatters = () => {
    if (matters.length === 0) return

    const confirmed = window.confirm(
      'Clear all submitted matters? This cannot be undone.'
    )

    if (confirmed) {
      setMatters([])
      closeMatter()
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const statusClasses = (status: MatterStatus) => {
    switch (status) {
      case 'Submitted':
        return 'bg-purple-100 text-purple-700'
      case 'Pending':
        return 'bg-amber-100 text-amber-700'
      case 'In Progress':
        return 'bg-blue-100 text-blue-700'
      case 'Paused':
        return 'bg-orange-100 text-orange-700'
      case 'Resolved':
        return 'bg-green-100 text-green-700'
      case 'Unresolved':
        return 'bg-red-100 text-red-700'
    }
  }



  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Interns Supervisor Support Desk
            </h1>

            <p className="text-sm text-slate-500">
              Manage intern matters and supervisor support
            </p>
          </div>

          <div className="flex rounded-lg bg-slate-100 p-1">

            <button
              onClick={() => {
                setActiveView('intern')
                closeMatter()
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                activeView === 'intern'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Intern
            </button>

            <button
              onClick={() => {
                setActiveView('supervisor')
                closeMatter()
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                activeView === 'supervisor'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              Supervisor
            </button>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* ================= INTERN VIEW ================= */}
        {activeView === 'intern' && (
          <div className="space-y-6">

            {/* Availability */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">

              <p className="text-sm font-medium text-slate-500">
                Supervisor Availability
              </p>

              <div className="mt-3 flex items-center gap-3">

                <span
                  className={`h-3 w-3 rounded-full ${
                    supervisorStatus === 'In Office'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                />

                <h2 className="text-2xl font-bold text-slate-900">
                  {supervisorStatus}
                </h2>

              </div>

              <p className="mt-2 text-sm text-slate-500">
                Next physical office availability:{' '}
                <strong className="text-slate-700">
                  {new Date(nextOfficeDate).toLocaleDateString(
                    'en-NG',
                    {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }
                  )}
                </strong>
              </p>

            </div>

            {/* Submission Form */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">

              <h2 className="text-lg font-semibold text-slate-900">
                Submit a Matter
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Submit an issue or request for supervisor attention.
              </p>

              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  submitMatter()
                }}
                className="mt-6 space-y-6"
              >

                <div className="grid gap-5 md:grid-cols-2">

                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Full Name *
                    </label>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        handleFormChange(
                          'name',
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-300"
                      placeholder="Your full name"
                    />
                  </div>

                  {/* Intern Type */}
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Intern Type *
                    </label>

                    <select
                      value={form.internType}
                      onChange={(event) =>
                        handleFormChange(
                          'internType',
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5"
                    >
                      <option>University Intern</option>
                      <option>NYSC Intern</option>
                    </select>


                    
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Email *
                    </label>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        handleFormChange(
                          'email',
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-lg border px-3 py-2.5"
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Phone Number *
                    </label>

                    <input
                      value={form.phone}
                      onChange={(event) =>
                        handleFormChange(
                          'phone',
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-lg border px-3 py-2.5"
                      placeholder="Phone number"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Office Location *
                    </label>

                    <select
                      value={form.location}
                      onChange={(event) =>
                        handleFormChange(
                          'location',
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5"
                    >
                      <option>Abuja</option>
                      <option>Kaduna</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {form.location === 'Other' && (
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Specify Location *
                      </label>

                      <input
                        value={form.otherLocation}
                        onChange={(event) =>
                          handleFormChange(
                            'otherLocation',
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-lg border px-3 py-2.5"
                        placeholder="Enter location"
                      />
                    </div>
                  )}

                </div>

                {/* Matter */}
                <div className="border-t pt-6">

                  <h3 className="font-semibold text-slate-900">
                    Matter Information
                  </h3>

                  <div className="mt-5 space-y-5">

                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Matter Type *
                      </label>

                      <select
                        value={form.matterType}
                        onChange={(event) =>
                          handleFormChange(
                            'matterType',
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5"
                      >
                        {matterTypes.map((type) => (
                          <option key={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {form.matterType === 'Other' && (
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Specify Matter Type *
                        </label>

                        <input
                          value={form.otherMatterType}
                          onChange={(event) =>
                            handleFormChange(
                              'otherMatterType',
                              event.target.value
                            )
                          }
                          className="mt-2 w-full rounded-lg border px-3 py-2.5"
                          placeholder="Describe the matter type"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Preferred Handling *
                      </label>

                      <select
                        value={form.handling}
                        onChange={(event) =>
                          handleFormChange(
                            'handling',
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5"
                      >
                        <option>Remote</option>
                        <option>Physical</option>
                        <option>Either / Not Sure</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        Describe the Matter *
                      </label>

                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          handleFormChange(
                            'description',
                            event.target.value
                          )
                        }
                        rows={5}
                        className="mt-2 w-full rounded-lg border px-3 py-2.5"
                        placeholder="Briefly explain the issue or request..."
                      />
                    </div>

                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Submit Matter
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}

        {/* ================= SUPERVISOR VIEW ================= */}
        {activeView === 'supervisor' && (
          <div className="space-y-6">

            {/* Status */}
            <div className="rounded-xl border bg-white p-6 shadow-sm">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                <div>

                  <p className="text-sm font-medium text-slate-500">
                    Supervisor Status
                  </p>

                  <div className="mt-2 flex items-center gap-3">

                    <span
                      className={`h-3 w-3 rounded-full ${
                        supervisorStatus === 'In Office'
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      }`}
                    />

                    <h2 className="text-2xl font-bold text-slate-900">
                      {supervisorStatus}
                    </h2>

                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Next physical office availability:{' '}
                    <strong className="text-slate-700">
                      {new Date(nextOfficeDate).toLocaleDateString(
                        'en-NG',
                        {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }
                      )}
                    </strong>
                  </p>

                </div>

                <div className="flex gap-3">

                  <button
                    onClick={() =>
                      setSupervisorStatus('In Office')
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      supervisorStatus === 'In Office'
                        ? 'bg-green-600 text-white'
                        : 'border text-slate-700'
                    }`}
                  >
                    In Office
                  </button>

                  <button
                    onClick={() =>
                      setSupervisorStatus('Working Remotely')
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      supervisorStatus === 'Working Remotely'
                        ? 'bg-blue-600 text-white'
                        : 'border text-slate-700'
                    }`}
                  >
                    Working Remotely
                  </button>

                </div>

              </div>

            </div>

            {/* Dashboard Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Total Matters
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {matters.length}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Pending
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {
                    matters.filter(
                      (matter) => matter.status === 'Pending'
                    ).length
                  }
                </p>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  In Progress
                </p>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {
                    matters.filter(
                      (matter) => matter.status === 'In Progress'
                    ).length
                  }
                </p>
              </div>

              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Resolved
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {
                    matters.filter(
                      (matter) => matter.status === 'Resolved'
                    ).length
                  }
                </p>
              </div>

            </div>

            {/* Matter Detail */}
            {selectedMatter ? (
              <div className="rounded-xl border bg-white shadow-sm">

                <div className="flex items-center justify-between border-b p-6">

                  <div>
                    <p className="text-sm text-slate-500">
                      Matter #{selectedMatter.id}
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {selectedMatter.matterType}
                    </h2>
                  </div>

                  <button
                    onClick={closeMatter}
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    ← Back to Queue
                  </button>

                </div>

                <div className="p-6">

                  <div className="grid gap-6 md:grid-cols-2">

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Intern
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedMatter.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Intern Type
                      </p>
                      <p className="mt-1 text-slate-700">
                        {selectedMatter.internType}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Email
                      </p>
                      <p className="mt-1 text-slate-700">
                        {selectedMatter.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Phone
                      </p>
                      <p className="mt-1 text-slate-700">
                        {selectedMatter.phone}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Office Location
                      </p>
                      <p className="mt-1 text-slate-700">
                        {selectedMatter.location}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Preferred Handling
                      </p>
                      <p className="mt-1 text-slate-700">
                        {selectedMatter.handling}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Submitted
                      </p>
                      <p className="mt-1 text-slate-700">
                        {formatDate(selectedMatter.submittedAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Current Status
                      </p>

                      <span
                        className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClasses(
                          selectedMatter.status
                        )}`}
                      >
                        {selectedMatter.status}
                      </span>
                    </div>

                  </div>

                  {/* Description */}
                  <div className="mt-8 border-t pt-6">

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Description
                    </p>

                    <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-700">
                      {selectedMatter.description}
                    </p>

                  </div>

                  {/* Status */}
                  <div className="mt-8 border-t pt-6">

                    <label className="text-sm font-medium text-slate-700">
                      Matter Status
                    </label>

                    <select
                      value={selectedMatter.status}
                      onChange={(event) =>
                        changeStatus(
                          event.target.value as MatterStatus
                        )
                      }
                      className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5 md:w-80"
                    >
                      <option>Submitted</option>
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Paused</option>
                      <option>Resolved</option>
                      <option>Unresolved</option>
                    </select>

                  </div>

                  {/* Pause Reason */}
                  {selectedMatter.status === 'Paused' && (
                    <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4">

                      <label className="text-sm font-medium text-orange-900">
                        Pause Reason
                      </label>

                      <select
                        value={pauseReasonDraft}
                        onChange={(event) =>
                          setPauseReasonDraft(event.target.value)
                        }
                        className="mt-2 w-full rounded-lg border bg-white px-3 py-2.5"
                      >
                        <option value="">
                          Select a reason
                        </option>

                        {pauseReasons.map((reason) => (
                          <option key={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={savePauseReason}
                        className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white"
                      >
                        Save Pause Reason
                      </button>

                    </div>
                  )}

                  {/* Supervisor Note */}
                  <div className="mt-8 border-t pt-6">

                    <label className="text-sm font-medium text-slate-700">
                      Supervisor Note
                    </label>

                    <textarea
                      value={noteDraft}
                      onChange={(event) =>
                        setNoteDraft(event.target.value)
                      }
                      rows={4}
                      className="mt-2 w-full rounded-lg border px-3 py-2.5"
                      placeholder="Add an internal note about this matter..."
                    />

                    <button
                      onClick={saveSupervisorNote}
                      className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    >
                      Save Note
                    </button>

                  </div>

                </div>
              </div>
            ) : (
              <>
                {/* Queue Controls */}
                <div className="rounded-xl border bg-white p-5 shadow-sm">

                  <div className="flex flex-col gap-4 md:flex-row">

                    <input
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                      placeholder="Search matters..."
                      className="flex-1 rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-300"
                    />

                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(
                          event.target.value as
                            | 'All'
                            | MatterStatus
                        )
                      }
                      className="rounded-lg border bg-white px-3 py-2.5"
                    >
                      <option>All</option>
                      <option>Submitted</option>
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Paused</option>
                      <option>Resolved</option>
                      <option>Unresolved</option>
                    </select>

                    <button
                      onClick={clearAllMatters}
                      className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Clear All
                    </button>

                  </div>

                </div>

                {/* Matter Queue */}
                <div className="rounded-xl border bg-white shadow-sm">

                  <div className="border-b p-6">
                    <h2 className="text-lg font-semibold text-slate-900">
                      Matter Queue
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Review and manage submitted matters.
                    </p>

                    <div className="mt-5 flex flex-col gap-3 md:flex-row">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by name, email, matter type or ID..."
                        className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-slate-300"
                      />

                      <select
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(
                            event.target.value as 'All' | MatterStatus
                          )
                        }
                        className="rounded-lg border bg-white px-3 py-2.5 outline-none md:w-52"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Paused">Paused</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Unresolved">Unresolved</option>
                      </select>

                      <select
                        value={handlingFilter}
                        onChange={(event) =>
                          setHandlingFilter(
                            event.target.value as 'All' | HandlingMethod
                          )
                        }
                        className="rounded-lg border bg-white px-3 py-2.5 outline-none md:w-52"
                      >
                        <option value="All">All Handling</option>
                        <option value="Remote">Remote</option>
                        <option value="Physical">Physical</option>
                        <option value="Either / Not Sure">Either / Not Sure</option>
                      </select>
                    </div>
                  </div>

                  {matters.length === 0 ? (
                  
                    <div className="p-12 text-center">

                      <p className="font-medium text-slate-700">
                        {matters.length === 0
                          ? 'No matters submitted'
                          : 'No matching matters'}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {matters.length === 0
                          ? 'Submitted matters will appear here.'
                          : 'Try changing your search or status filter.'}
                      </p>

                    </div>
                  ) : (
                    <div className="divide-y">

                      {filteredMatters.map((matter) => (
                        <button
                          key={matter.id}
                          onClick={() => openMatter(matter)}
                          className="block w-full cursor-pointer p-6 text-left transition hover:bg-slate-50"
                        >

                          <div className="flex flex-col justify-between gap-4 md:flex-row">

                            <div>

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="font-semibold text-slate-900">
                                  #{matter.id}
                                </span>

                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                  {matter.internType}
                                </span>

                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                  {matter.location}
                                </span>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                                    matter.handling === 'Physical'
                                      ? 'bg-orange-100 text-orange-700'
                                      : matter.handling === 'Remote'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {matter.handling}
                                </span>

                              </div>

                              <h3 className="mt-3 font-semibold text-slate-900">
                                {matter.matterType}
                              </h3>

                              <p className="mt-1 text-sm text-slate-600">
                                {matter.name}
                              </p>

                              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                {matter.description}
                              </p>

                            </div>

                            <div className="shrink-0">

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClasses(
                                  matter.status
                                )}`}
                              >
                                {matter.status}
                              </span>

                              <p className="mt-2 text-xs text-slate-400">
                                {formatDate(matter.submittedAt)}
                              </p>

                            </div>

                          </div>

                        </button>
                      ))}

                    </div>
                  )}

                </div>
              </>
            )}

          </div>
        )}

      </main>
    </div>
  )
}

export default App