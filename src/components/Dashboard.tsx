import { useState, useMemo } from 'react'
import {
  Dumbbell,
  Target,
  Trophy,
  Sparkles,
  Zap,
  Activity,
  Flame
} from 'lucide-react'

// ─── Chart Types & Data ───
interface HistoryPoint {
  date: string
  score: number
  label: string
  details: string
  weight: string
}

const squatHistory: HistoryPoint[] = [
  { date: 'May 10', score: 72, label: 'Knee caving detected', details: 'Felt slight valgus instability on rep 4', weight: '225 lbs' },
  { date: 'May 17', score: 78, label: 'Improved foot drive', details: 'Parallel depth achieved; minor ankle lift', weight: '225 lbs' },
  { date: 'May 24', score: 85, label: 'Perfect spine alignment', details: 'Bar path aligned and center of gravity stable', weight: '245 lbs' },
  { date: 'May 31', score: 80, label: 'Slight heel lift', details: 'Descended too rapidly on 3rd set', weight: '265 lbs' },
  { date: 'Jun 07', score: 88, label: 'Parallel depth achieved', details: 'Knee tracking stable throughout eccentric', weight: '275 lbs' },
  { date: 'Jun 14', score: 91, label: 'Excellent vertical path', details: 'Perfect control on descent and lockout', weight: '295 lbs' },
  { date: 'Jun 21', score: 95, label: 'Elite squat depth', details: 'Consistent 1.5 inches below parallel, solid base', weight: '315 lbs' }
]

const benchHistory: HistoryPoint[] = [
  { date: 'May 10', score: 68, label: 'Elbow flare detected', details: 'Left elbow flared out too early on rep 5', weight: '185 lbs' },
  { date: 'May 17', score: 74, label: 'Solid arch control', details: 'Retracted scapula was stable; bar speed slow', weight: '185 lbs' },
  { date: 'May 24', score: 77, label: 'Chest bounce warning', details: 'Bounced barbell slightly off sternum on set 3', weight: '205 lbs' },
  { date: 'May 31', score: 82, label: 'Controlled eccentric', details: 'Smooth path alignment, excellent tucking', weight: '205 lbs' },
  { date: 'Jun 07', score: 85, label: 'Strong leg drive', details: 'Stable foot placement; minor wrist extension', weight: '225 lbs' },
  { date: 'Jun 14', score: 89, label: 'Symmetrical path tracking', details: 'Left and right speed synchronized', weight: '235 lbs' },
  { date: 'Jun 21', score: 92, label: 'Flawless chest touch', details: 'Zero horizontal deviation, powerful lockout', weight: '245 lbs' }
]

const analyticalStats = [
  {
    label: 'Weekly Volume',
    value: '48,500',
    unit: 'lbs',
    icon: Dumbbell,
    change: '+15.2%',
    changeType: 'positive',
    description: 'Higher intensity sets completed'
  },
  {
    label: 'Squat Depth Accuracy',
    value: '94.2',
    unit: '%',
    icon: Target,
    change: '+3.1%',
    changeType: 'positive',
    description: 'Achieving true parallel depth'
  },
  {
    label: 'Bench Path Symmetry',
    value: '89.6',
    unit: '%',
    icon: Activity,
    change: '+1.5%',
    changeType: 'positive',
    description: 'Minimal lateral deviation'
  },
  {
    label: 'Form Quality Rating',
    value: '91',
    unit: '/100',
    icon: Trophy,
    change: 'Low Risk',
    changeType: 'neutral',
    description: 'Averaged over 18 sets checked'
  }
]

export default function Dashboard() {
  const [selectedExercise, setSelectedExercise] = useState<'squat' | 'bench'>('squat')
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(6) // Default to latest point

  const historyData = useMemo(() => {
    return selectedExercise === 'squat' ? squatHistory : benchHistory
  }, [selectedExercise])

  // SVG dimensions for trend chart
  const width = 600
  const height = 220
  const paddingX = 40
  const paddingY = 30

  // Calculate coordinates for SVG paths
  const chartPoints = useMemo(() => {
    return historyData.map((pt, i) => {
      const x = paddingX + (i * (width - paddingX * 2)) / (historyData.length - 1)
      // Map score (60 - 100) to Y coordinates
      const minScore = 60
      const maxScore = 100
      const y = height - paddingY - ((pt.score - minScore) / (maxScore - minScore)) * (height - paddingY * 2)
      return { x, y }
    })
  }, [historyData])

  // Draw the smooth cubic line path
  const linePath = useMemo(() => {
    if (chartPoints.length === 0) return ''
    return chartPoints.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`
      
      // Calculate control points for smooth curves
      const prevPt = chartPoints[i - 1]
      const cpX1 = prevPt.x + (pt.x - prevPt.x) / 2
      const cpY1 = prevPt.y
      const cpX2 = prevPt.x + (pt.x - prevPt.x) / 2
      const cpY2 = pt.y
      
      return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pt.x} ${pt.y}`
    }, '')
  }, [chartPoints])

  // Draw the gradient filled area under the line
  const areaPath = useMemo(() => {
    if (chartPoints.length === 0) return ''
    const startX = chartPoints[0].x
    const endX = chartPoints[chartPoints.length - 1].x
    const bottomY = height - paddingY
    return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`
  }, [chartPoints, linePath])

  const currentHoveredPoint = hoveredPointIndex !== null ? historyData[hoveredPointIndex] : null
  const currentHoveredCoords = hoveredPointIndex !== null ? chartPoints[hoveredPointIndex] : null

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-gym-text">
            Performance <span className="fire-gradient-text">Dashboard</span>
          </h1>
          <p className="text-gym-text-muted mt-1 text-sm">
            Lifting analytics, biometric trends, and safety ratings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-gym-surface/60 border border-gym-border px-4 py-2 rounded-xl text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-fire-500 animate-pulse-glow" />
          <span className="text-gym-text-muted">Live Bio-Tracker Active</span>
        </div>
      </div>

      {/* Grid of modern analytical widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticalStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              className="glass-card stat-glow p-5 flex flex-col justify-between"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gym-text-muted uppercase tracking-wider">
                  {stat.label}
                </span>
                <div className="w-9 h-9 bg-gym-surface-alt border border-gym-border/80 rounded-xl flex items-center justify-center text-fire-500 shadow-sm shadow-fire-500/5">
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-3xl font-display font-black text-gym-text">
                  {stat.value}
                </span>
                <span className="text-sm font-semibold text-gym-text-muted">
                  {stat.unit}
                </span>
              </div>

              <div className="mt-3.5 pt-3 border-t border-gym-border/40 flex items-center justify-between text-xs">
                <span className="text-gym-text-dim font-medium">{stat.description}</span>
                <span className="flex items-center gap-0.5 font-bold text-fire-500">
                  {stat.change}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Historical Form Stability Trends Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Interactive Line Chart Card */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-display font-bold text-gym-text flex items-center gap-2">
                <Zap className="w-4.5 h-4.5 text-fire-500" />
                Historical Form Stability Trend
              </h2>
              <p className="text-xs text-gym-text-muted">
                Track how stance, barbell path, and speed change over cycles.
              </p>
            </div>

            {/* Exercise Selector Tabs */}
            <div className="flex bg-gym-surface border border-gym-border p-1 rounded-xl gap-1">
              <button
                onClick={() => {
                  setSelectedExercise('squat')
                  setHoveredPointIndex(6) // Reset hover to latest point
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedExercise === 'squat'
                    ? 'fire-gradient text-white shadow-md shadow-fire-500/20'
                    : 'text-gym-text-muted hover:text-gym-text'
                }`}
              >
                Back Squat
              </button>
              <button
                onClick={() => {
                  setSelectedExercise('bench')
                  setHoveredPointIndex(6) // Reset hover to latest point
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedExercise === 'bench'
                    ? 'fire-gradient text-white shadow-md shadow-fire-500/20'
                    : 'text-gym-text-muted hover:text-gym-text'
                }`}
              >
                Bench Press
              </button>
            </div>
          </div>

          {/* Interactive SVG Chart Canvas */}
          <div className="relative w-full aspect-[2.8/1] min-h-[180px] bg-gym-bg/30 border border-gym-border/40 rounded-xl overflow-hidden px-1 py-2 flex items-center justify-center">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full overflow-visible"
            >
              {/* Definitions for Gradients */}
              <defs>
                <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-fire-500)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--color-fire-500)" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--color-fire-600)" />
                  <stop offset="50%" stopColor="var(--color-fire-500)" />
                  <stop offset="100%" stopColor="var(--color-fire-400)" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              {[60, 70, 80, 90, 100].map((score) => {
                const y = height - paddingY - ((score - 60) / (100 - 60)) * (height - paddingY * 2)
                return (
                  <g key={score} className="opacity-40">
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="var(--color-gym-border)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      fill="var(--color-gym-text-dim)"
                      fontSize="9"
                      fontWeight="600"
                      textAnchor="end"
                    >
                      {score}%
                    </text>
                  </g>
                )
              })}

              {/* Chart Gradient Area */}
              <path d={areaPath} fill="url(#chartAreaGrad)" />

              {/* Chart Line */}
              <path d={linePath} fill="none" stroke="url(#chartLineGrad)" strokeWidth="3" strokeLinecap="round" />

              {/* Hover Indicator Vertical Bar */}
              {currentHoveredCoords && (
                <line
                  x1={currentHoveredCoords.x}
                  y1={paddingY}
                  x2={currentHoveredCoords.x}
                  y2={height - paddingY}
                  stroke="var(--color-fire-500)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="opacity-70"
                />
              )}

              {/* Interactive Circles / Anchors */}
              {chartPoints.map((pt, i) => {
                const isHovered = hoveredPointIndex === i
                return (
                  <g key={i}>
                    {/* Circle Node */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? '7' : '4.5'}
                      fill="var(--color-gym-bg)"
                      stroke="var(--color-fire-500)"
                      strokeWidth={isHovered ? '3.5' : '2.5'}
                      className="transition-all duration-150"
                    />
                    
                    {/* Glowing highlight when hovered */}
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="14"
                        fill="var(--color-fire-500)"
                        fillOpacity="0.15"
                      />
                    )}

                    {/* Date label at bottom */}
                    <text
                      x={pt.x}
                      y={height - 10}
                      fill={isHovered ? 'var(--color-gym-text)' : 'var(--color-gym-text-dim)'}
                      fontSize="10"
                      fontWeight={isHovered ? '700' : '500'}
                      textAnchor="middle"
                    >
                      {historyData[i].date}
                    </text>

                    {/* Invisible Larger Interactive Area */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="20"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPointIndex(i)}
                    />
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        {/* Selected Data Point Diagnostics / Tooltip panel */}
        <div className="lg:col-span-1 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gym-border/60">
              <h3 className="text-sm font-bold text-gym-text uppercase tracking-wider">
                Trend Diagnostics
              </h3>
              <span className="text-[10px] text-gym-text-dim font-bold uppercase">
                {selectedExercise === 'squat' ? 'Back Squat' : 'Bench Press'}
              </span>
            </div>

            {currentHoveredPoint ? (
              <div className="mt-4 space-y-4 animate-fade-in">
                {/* Date and Score Details */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gym-text-dim font-bold uppercase">Session Date</span>
                    <p className="text-sm font-extrabold text-gym-text">{currentHoveredPoint.date}, 2026</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gym-text-dim font-bold uppercase">Stability Score</span>
                    <p className="text-xl font-display font-black text-fire-500">{currentHoveredPoint.score}%</p>
                  </div>
                </div>

                {/* Weight Details */}
                <div className="bg-gym-surface/40 border border-gym-border/80 rounded-xl px-4 py-3">
                  <span className="text-[10px] text-gym-text-dim font-bold uppercase block">Lifting Load</span>
                  <p className="text-sm font-bold text-gym-text mt-0.5">{currentHoveredPoint.weight}</p>
                </div>

                {/* Primary Feedback Tag */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gym-text-dim font-bold uppercase">Coach Summary</span>
                  <div className="flex items-start gap-2.5 bg-gym-surface-alt/40 border-l-2 border-fire-500 rounded-r-xl px-3 py-2">
                    <Sparkles className="w-4 h-4 text-fire-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gym-text leading-tight">{currentHoveredPoint.label}</p>
                      <p className="text-[11px] text-gym-text-muted mt-1 leading-normal">{currentHoveredPoint.details}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gym-text-dim text-xs">
                Hover over the chart nodes to view session stability telemetry.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gym-border/40 mt-6">
            <div className="flex items-center justify-between text-xs text-gym-text-dim">
              <span>Goal Target:</span>
              <span className="text-fire-500 font-extrabold">&gt;90% Consistency</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Biomechanical Milestones & Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Biomechanical Milestones */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-fire-500" />
            <h3 className="font-display font-bold text-base text-gym-text">
              Active Milestone Lock-Ins
            </h3>
          </div>

          <div className="space-y-4.5">
            {[
              { name: 'Full Squat Depth Parallel', progress: 100, status: 'Locked In', color: 'bg-fire-500' },
              { name: 'Wrist Stability (Bench Press)', progress: 100, status: 'Locked In', color: 'bg-fire-500' },
              { name: 'Knee Tracking Stability (Squats)', progress: 92, status: '92% Consistent', color: 'bg-fire-500' },
              { name: 'Neutral Spine Alignment (Deadlifts)', progress: 85, status: '85% Consistent', color: 'bg-fire-400' },
              { name: 'Bar Path Verticality (Bench)', progress: 78, status: '78% Consistent', color: 'bg-yellow-500' }
            ].map((milestone, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gym-text">{milestone.name}</span>
                  <span className="text-[10px] text-gym-text-muted font-semibold">{milestone.status}</span>
                </div>
                <div className="h-1.5 bg-gym-surface-alt rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${milestone.color}`}
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Session Feed */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-fire-500" />
              <h3 className="font-display font-bold text-base text-gym-text">
                Recent Form Telemetry Logs
              </h3>
            </div>
            <span className="text-[10px] text-gym-text-dim font-bold uppercase">Real-time</span>
          </div>

          <div className="space-y-3">
            {[
              { type: 'Squat', score: 95, time: '2 hours ago', note: 'Perfect depth and knee stability.' },
              { type: 'Bench Press', score: 92, time: '1 day ago', note: 'Very symmetrical ascension; minimal wrist roll.' },
              { type: 'Bench Press', score: 85, time: '2 days ago', note: 'Left side lockout lagged slightly.' },
              { type: 'Squat', score: 80, time: '3 days ago', note: 'Heels lifted 0.8" at bottom of set 3.' }
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gym-surface/40 hover:bg-gym-surface-alt/30 border border-gym-border/80 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gym-surface-alt border border-gym-border/80 flex items-center justify-center text-fire-500 font-bold text-xs">
                    {item.type[0]}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gym-text group-hover:text-fire-500 transition-colors">
                      {item.type} Analysis
                    </h4>
                    <p className="text-[10.5px] text-gym-text-dim mt-0.5 leading-tight">{item.note}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span className="text-xs font-extrabold text-fire-500">{item.score}%</span>
                  <p className="text-[9px] text-gym-text-dim mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
