import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Dumbbell,
  Flame,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
  RotateCcw
} from 'lucide-react'

// ─── Types ───
type ViewMode = 'month' | 'week'
type WorkoutType = 'amrap' | 'emom' | 'tabata' | 'strength' | 'rest'

interface Exercise {
  name: string
  sets: string
  weight: string
  completed: boolean
}

interface WorkoutBlock {
  type: WorkoutType
  label: string
  duration: string
  exercises: Exercise[]
  notes: string
}

// ─── Workout Styling ───
const blockStyles: Record<WorkoutType, { bg: string; text: string; dot: string; badge: string }> = {
  strength: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  },
  amrap: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    dot: 'bg-green-400',
    badge: 'bg-green-500/10 text-green-400 border border-green-500/20',
  },
  emom: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  },
  tabata: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    dot: 'bg-red-400',
    badge: 'bg-red-500/10 text-red-400 border border-red-500/20',
  },
  rest: {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    dot: 'bg-zinc-400',
    badge: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  },
}


// ─── Prepopulated High-Intensity Functional Training Blocks ───
const blockTemplates: Record<WorkoutType, WorkoutBlock> = {
  strength: {
    type: 'strength',
    label: 'Strength & Conditioning',
    duration: '60 mins',
    exercises: [
      { name: 'Barbell Back Squat (Overload)', sets: '5 × 5', weight: '275 lbs', completed: true },
      { name: 'Flat Bench Press (Concentric)', sets: '4 × 6', weight: '185 lbs', completed: true },
      { name: 'Barbell Conventional Deadlift', sets: '3 × 5', weight: '315 lbs', completed: false },
      { name: 'Weighted Pull-Ups', sets: '3 × 8', weight: 'BW + 25 lbs', completed: false },
    ],
    notes: 'Prioritize skeletal depth and vert bar path alignment. Increase Squat target next cycle.'
  },
  amrap: {
    type: 'amrap',
    label: '20 Min AMRAP Conditioning',
    duration: '20 mins',
    exercises: [
      { name: 'Kettlebell Swings (Heavy)', sets: '15 Reps', weight: '53 lbs', completed: true },
      { name: 'Dumbbell Thrusters', sets: '12 Reps', weight: '35 lbs each', completed: true },
      { name: 'Plyometric Box Jumps', sets: '9 Reps', weight: '24" box', completed: false },
      { name: 'Strict Toes-to-Bar', sets: '6 Reps', weight: 'Bodyweight', completed: false },
    ],
    notes: 'Complete as many rounds as possible. Transition quickly between stations. Maintain flat lumbar spine.'
  },
  emom: {
    type: 'emom',
    label: '16 Min EMOM Power Block',
    duration: '16 mins',
    exercises: [
      { name: 'Minute 1: Barbell Power Clean', sets: '3 Reps', weight: '135 lbs', completed: true },
      { name: 'Minute 2: Handstand Push-Ups', sets: '8 Reps', weight: 'Bodyweight', completed: true },
      { name: 'Minute 3: Double-Unders (Rope)', sets: '40 Reps', weight: 'Speed Rope', completed: false },
      { name: 'Minute 4: Rowing Ergometer', sets: '12 Cals', weight: 'Damper 6', completed: false },
    ],
    notes: 'Every Minute On the Minute. Remaining time is rest. Focus on clean catcher mechanics.'
  },
  tabata: {
    type: 'tabata',
    label: 'Tabata High-Intensity Circuits',
    duration: '24 mins',
    exercises: [
      { name: 'Sprint Interval (Assault Bike)', sets: '8 Rounds x 20s/10s', weight: 'Max effort', completed: true },
      { name: 'Burpee Box Jump-Overs', sets: '8 Rounds x 20s/10s', weight: '24" box', completed: true },
      { name: 'Dumbbell Devil Press', sets: '8 Rounds x 20s/10s', weight: '30 lbs each', completed: true },
      { name: 'Wall Ball Shots (Target)', sets: '8 Rounds x 20s/10s', weight: '20 lbs ball', completed: false },
    ],
    notes: '20 seconds max output, 10 seconds rest. 4 separate circuits total. Aim for consistency across rounds.'
  },
  rest: {
    type: 'rest',
    label: 'Active Recovery Block',
    duration: '30 mins',
    exercises: [
      { name: 'Myofascial Foam Rolling', sets: '10 Mins', weight: 'Quads/Lats', completed: false },
      { name: 'Dynamic Mobility Warmup', sets: '12 Mins', weight: 'Hips/Shoulders', completed: false },
      { name: 'Diaphragmatic Breathing', sets: '8 Mins', weight: 'Parasympathetic', completed: false },
    ],
    notes: 'Rehydrate, optimize parasympathetic state, and focus on tight joint mobilization.'
  }
}

// ─── Generate Pre-Populated Blocks for Dates ───
function getWorkoutForDate(date: Date): WorkoutBlock {
  const day = date.getDay() // 0=Sun, 1=Mon, ...
  
  let type: WorkoutType
  switch (day) {
    case 1: // Mon
    case 4: // Thu
      type = 'strength'
      break
    case 2: // Tue
    case 5: // Fri
      type = 'amrap'
      break
    case 3: // Wed
      type = 'emom'
      break
    case 6: // Sat
      type = 'tabata'
      break
    case 0: // Sun
    default:
      type = 'rest'
      break
  }

  return blockTemplates[type]
}

// Calendar Calculation Helpers
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Convert Sun=0 to Mon-start: Mon=0, Tue=1...
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const LEGEND_ITEMS: { type: WorkoutType; label: string }[] = [
  { type: 'strength', label: 'Strength & Conditioning' },
  { type: 'amrap', label: 'AMRAP Conditioning' },
  { type: 'emom', label: 'EMOM Power' },
  { type: 'tabata', label: 'Tabata Circuits' },
  { type: 'rest', label: 'Active Recovery' },
]

export default function WorkoutPlanner() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1)) // June 2026 default
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2026, 5, 26)) // Highlight June 26, 2026
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Generate calendar grid cells
  const calendarCells = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const daysInPrevMonth = getDaysInMonth(year, month - 1)

    const cells: { date: Date; isCurrentMonth: boolean }[] = []

    // Previous month filler
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      })
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      })
    }

    // Next month filler
    const remaining = 7 - (cells.length % 7)
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push({
          date: new Date(year, month + 1, d),
          isCurrentMonth: false,
        })
      }
    }

    return cells
  }, [year, month])

  const weekCells = useMemo(() => {
    const reference = selectedDate ?? today
    const refDay = reference.getDay()
    const mondayOffset = refDay === 0 ? -6 : 1 - refDay
    const monday = new Date(reference)
    monday.setDate(reference.getDate() + mondayOffset)

    const cells: { date: Date; isCurrentMonth: boolean }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      cells.push({ date: d, isCurrentMonth: d.getMonth() === month })
    }
    return cells
  }, [selectedDate, today, month])

  const displayCells = viewMode === 'month' ? calendarCells : weekCells
  const selectedWorkout = selectedDate ? getWorkoutForDate(selectedDate) : null

  function navigateMonth(direction: number) {
    setCurrentDate(new Date(year, month + direction, 1))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display font-black tracking-tight text-gym-text">
          Workout <span className="fire-gradient-text">Planner</span>
        </h1>
        <p className="text-gym-text-muted mt-1 text-sm">
          Plan, track, and load high-intensity functional training blocks.
        </p>
      </div>

      {/* Calendar Controls */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Month Navigator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-xl bg-gym-surface-alt border border-gym-border/80 hover:bg-gym-border text-gym-text-muted hover:text-gym-text transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <h3 className="font-display font-bold text-lg text-gym-text min-w-[150px] text-center">
              {MONTH_NAMES[month]} {year}
            </h3>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-xl bg-gym-surface-alt border border-gym-border/80 hover:bg-gym-border text-gym-text-muted hover:text-gym-text transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Mode selector + Add button */}
          <div className="flex items-center gap-2">
            <div className="flex bg-gym-surface border border-gym-border p-1 rounded-xl gap-1">
              {(['month', 'week'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                    viewMode === mode
                      ? 'fire-gradient text-white shadow-md shadow-fire-500/20'
                      : 'text-gym-text-muted hover:text-gym-text'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button className="fire-gradient flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-black shadow-md shadow-fire-500/20 hover:shadow-fire-500/40 hover:scale-[1.02] transition-all cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Add Custom Block</span>
            </button>
          </div>
        </div>
      </div>

      {/* Block Classification Legend */}
      <div className="flex flex-wrap gap-2.5">
        {LEGEND_ITEMS.map((item) => {
          const style = blockStyles[item.type]
          return (
            <span
              key={item.type}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${style.badge}`}
            >
              <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              {item.label}
            </span>
          )
        })}
      </div>

      {/* Grid Layout: Calendar + Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Box */}
        <div className={`${selectedDate ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          <div className="glass-card p-4">
            {/* Headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2.5">
              {DAY_HEADERS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-bold text-gym-text-dim py-1.5 uppercase tracking-wider"
                >
                  <span className="hidden sm:inline">{d}</span>
                  <span className="sm:hidden">{d.charAt(0)}</span>
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {displayCells.map((cell, idx) => {
                const workout = getWorkoutForDate(cell.date)
                const isToday = isSameDay(cell.date, today)
                const isSelected = selectedDate ? isSameDay(cell.date, selectedDate) : false
                const style = blockStyles[workout.type]

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`
                      relative p-2 rounded-xl text-left transition-all duration-200 cursor-pointer min-h-[52px] sm:min-h-[76px] group flex flex-col justify-between
                      ${cell.isCurrentMonth ? '' : 'opacity-25'}
                      ${isSelected
                        ? 'ring-2 ring-fire-500 bg-fire-500/5'
                        : isToday
                          ? 'ring-2 ring-fire-500/40 bg-gym-surface-alt/40'
                          : 'hover:bg-gym-surface-alt/30 border border-gym-border/50'
                      }
                    `}
                  >
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'text-fire-500'
                          : cell.isCurrentMonth
                            ? 'text-gym-text-muted'
                            : 'text-gym-text-dim'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {/* Exercise Type Strip */}
                    {workout && cell.isCurrentMonth && (
                      <div className="w-full flex items-center justify-between mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        <span className={`hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${style.text} ${style.bg}`}>
                          {workout.type}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Selected Block Specification Panel */}
        {selectedDate && selectedWorkout && (
          <div className="lg:col-span-1">
            <div className="glass-card p-5 space-y-5 sticky top-4">
              {/* Date header */}
              <div>
                <p className="text-[10px] text-gym-text-dim font-bold uppercase tracking-wider">
                  Target Schedule
                </p>
                <h3 className="font-display font-black text-base text-gym-text mt-0.5">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </h3>

                <div className="mt-2.5 flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase ${blockStyles[selectedWorkout.type].badge}`}>
                    {selectedWorkout.label}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-gym-text-muted bg-gym-surface-alt px-2.5 py-1 rounded-lg border border-gym-border">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{selectedWorkout.duration}</span>
                  </div>
                </div>
              </div>

              {/* Workout Block details */}
              <div className="space-y-3.5">
                <span className="text-[10px] text-gym-text-dim font-bold uppercase block tracking-wider">
                  Prescription Checklist
                </span>
                <ul className="space-y-2">
                  {selectedWorkout.exercises.map((ex, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 p-3 bg-gym-surface/40 hover:bg-gym-surface-alt/20 border border-gym-border/80 rounded-xl transition-all group"
                    >
                      {ex.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-fire-500 mt-0.5 shrink-0 animate-pulse-glow" />
                      ) : (
                        <Circle className="w-4 h-4 text-gym-text-dim mt-0.5 shrink-0 group-hover:text-gym-text-muted" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-tight ${ex.completed ? 'text-gym-text' : 'text-gym-text-muted'}`}>
                          {ex.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gym-text-dim font-semibold">
                          <span>{ex.sets}</span>
                          <span>·</span>
                          <span>{ex.weight}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Block Notes */}
              <div className="space-y-2">
                <span className="text-[10px] text-gym-text-dim font-bold uppercase block tracking-wider">
                  Coach Prescription Notes
                </span>
                <p className="text-xs text-gym-text-muted leading-relaxed bg-gym-surface-alt/40 border border-gym-border/60 rounded-xl p-3">
                  {selectedWorkout.notes}
                </p>
              </div>

              {/* Start block trigger */}
              {selectedWorkout.type !== 'rest' && (
                <button className="w-full fire-gradient flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-xs font-black shadow-lg shadow-fire-500/20 hover:shadow-fire-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                  <Flame className="w-4 h-4 fill-white" />
                  Initiate Training Block
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Capacity Breakdown widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: 'Work Intensity Index', value: '88%', sub: 'Max Threshold', color: 'text-blue-400' },
          { icon: Dumbbell, label: 'Functional Load', value: '28.5k lbs', sub: 'Calculated AMRAP', color: 'text-green-400' },
          { icon: Clock, label: 'Heart Rate Zone 4', value: '42 mins', sub: 'High VO2 Output', color: 'text-yellow-400' },
          { icon: RotateCcw, label: 'Recovery Level', value: 'Optimal', sub: 'Heart Rate Var', color: 'text-red-400' },
        ].map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={idx} className="glass-card p-4 flex items-center gap-3.5">
              <div className={`p-2.5 rounded-xl bg-gym-surface-alt border border-gym-border/80 ${item.color}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-gym-text-dim font-bold uppercase tracking-wider">{item.label}</p>
                <p className="text-base font-display font-black text-gym-text mt-0.5">{item.value}</p>
                <p className="text-[9px] text-gym-text-muted mt-0.5">{item.sub}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
