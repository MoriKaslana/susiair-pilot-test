<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'
import type { SummaryPoint, SummaryResponse } from '~/types/api'

const props = defineProps<{
  summary: SummaryResponse | null
  /** True while a (re)fetch is running; the previous chart stays visible, dimmed. */
  loading: boolean
  error: string | null
}>()

defineEmits<{ retry: [] }>()

const { formatLongDate, formatHours, formatLimit, dayOfMonth, monthShort, monthNumber } = useDateFormat()

// SVG user units; the viewBox scales the whole drawing to the container width.
const WIDTH = 340
const HEIGHT = 230
const MARGIN = { top: 26, right: 14, bottom: 38, left: 36 }
const X_INSET = 8
const plotWidth = WIDTH - MARGIN.left - MARGIN.right
const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
const plotBottom = MARGIN.top + plotHeight
const plotRight = WIDTH - MARGIN.right

interface PlottedPoint extends SummaryPoint {
  index: number
  x: number
  y: number
}

const max = computed(() => props.summary?.max ?? 0)

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value))
}

function yOf(value: number): number {
  if (max.value <= 0) return plotBottom
  return MARGIN.top + plotHeight * (1 - clamp(value, 0, max.value) / max.value)
}

const step = computed(() => {
  const count = props.summary?.points.length ?? 0
  return count > 1 ? (plotWidth - X_INSET * 2) / (count - 1) : 0
})

const plotted = computed<PlottedPoint[]>(() => {
  const points = props.summary?.points ?? []
  return points.map((point, index) => ({
    ...point,
    index,
    x: points.length > 1 ? MARGIN.left + X_INSET + index * step.value : MARGIN.left + plotWidth / 2,
    y: yOf(point.rollingSum),
  }))
})

// Today is whichever point the API dates as today; no index is assumed.
const todayIndex = computed(() => {
  const points = props.summary?.points ?? []
  const byDate = points.findIndex((p) => p.date === props.summary?.today)
  if (byDate !== -1) return byDate
  let lastPast = -1
  points.forEach((p, i) => {
    if (!p.isFuture) lastPast = i
  })
  return lastPast
})
const todayPoint = computed(() => plotted.value[todayIndex.value] ?? null)

const firstFuture = computed(() => plotted.value.findIndex((p) => p.isFuture))
const pastPoints = computed(() =>
  firstFuture.value === -1 ? plotted.value : plotted.value.slice(0, firstFuture.value),
)
// The future segment starts at the last past point so the line stays connected.
const futurePoints = computed(() =>
  firstFuture.value === -1 ? [] : plotted.value.slice(Math.max(firstFuture.value - 1, 0)),
)

function linePath(points: PlottedPoint[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
}

const pastLine = computed(() => linePath(pastPoints.value))
const pastArea = computed(() => {
  const pts = pastPoints.value
  if (pts.length < 2) return ''
  const first = pts[0]!
  const last = pts[pts.length - 1]!
  return `${linePath(pts)} L${last.x.toFixed(1)} ${plotBottom} L${first.x.toFixed(1)} ${plotBottom} Z`
})
const futureLine = computed(() => linePath(futurePoints.value))

/** Roughly five round-numbered ticks from 0 up to (at most) the API max. */
const yTicks = computed(() => {
  const top = max.value
  if (!(top > 0)) return [0]
  const magnitude = Math.floor(Math.log10(top))
  let bestStep = top
  let bestScore = Infinity
  for (let exp = magnitude - 2; exp <= magnitude; exp++) {
    for (const base of [1, 2, 2.5, 5]) {
      const candidate = base * 10 ** exp
      const count = Math.floor(top / candidate + 1e-9) + 1
      if (count < 4) continue
      const score = Math.abs(count - 5)
      if (score <= bestScore) {
        bestScore = score
        bestStep = candidate
      }
    }
  }
  const ticks: number[] = []
  for (let v = 0; v <= top + 1e-9; v += bestStep) ticks.push(Math.round(v * 1e6) / 1e6)
  return ticks
})

function tickLabel(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

const xLabels = computed(() =>
  plotted.value.map((p, i, all) => {
    const prev = all[i - 1]
    const showMonth = !prev || monthNumber(prev.date) !== monthNumber(p.date)
    return {
      index: p.index,
      x: p.x,
      day: dayOfMonth(p.date),
      month: showMonth ? monthShort(p.date) : '',
      isToday: p.index === todayIndex.value,
    }
  }),
)

const limitY = computed(() => yOf(props.summary?.limit ?? 0))

const ariaLabel = computed(() => {
  const s = props.summary
  if (!s) return 'Rolling flight hours chart'
  return `Rolling ${s.windowDays}-day flight hours against a ${formatLimit(s.limit)} hour limit`
})

// --- Point inspection (hover, tap, keyboard focus) ---
const root = ref<HTMLElement | null>(null)
const activeIndex = ref<number | null>(null)
const activePoint = computed(() => (activeIndex.value === null ? null : (plotted.value[activeIndex.value] ?? null)))

const tooltipStyle = computed(() => {
  const p = activePoint.value
  if (!p) return {}
  return {
    left: `${clamp((p.x / WIDTH) * 100, 25, 75)}%`,
    top: `${(p.y / HEIGHT) * 100}%`,
  }
})
const tooltipBelow = computed(() => (activePoint.value ? activePoint.value.y < HEIGHT * 0.45 : false))

function onPointerEnter(event: PointerEvent, index: number) {
  if (event.pointerType === 'mouse') activeIndex.value = index
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse') activeIndex.value = null
}

function onBlur(index: number) {
  if (activeIndex.value === index) activeIndex.value = null
}

function onDocumentPointerDown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) activeIndex.value = null
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
watch(() => props.summary, () => {
  activeIndex.value = null
})

function pointLabel(p: PlottedPoint): string {
  return `${formatLongDate(p.date)}: ${formatHours(p.hours)} hours that day, rolling sum ${formatHours(p.rollingSum)} hours`
}
</script>

<template>
  <StateBlock v-if="error" state="error" bare :message="error" min-height="220px" @retry="$emit('retry')" />

  <StateBlock v-else-if="!summary" state="loading" bare :lines="6" min-height="220px" />

  <StateBlock
    v-else-if="summary.points.length === 0"
    state="empty"
    bare
    message="No flight hours to chart for this range."
    min-height="220px"
  />

  <div
    v-else
    ref="root"
    class="chart"
    :class="{ loading }"
    :aria-busy="loading"
    @pointerleave="onPointerLeave"
    @keydown.esc="activeIndex = null"
  >
    <LoaderCircle v-if="loading" class="spinner" :size="18" aria-label="Updating chart" />

    <svg
      class="svg"
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      role="group"
      :aria-label="ariaLabel"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="fh-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="area-top" />
          <stop offset="1" class="area-bottom" />
        </linearGradient>
      </defs>

      <!-- Y axis grid and tick labels -->
      <g v-for="tick in yTicks" :key="tick">
        <line class="grid" :x1="MARGIN.left" :x2="plotRight" :y1="yOf(tick)" :y2="yOf(tick)" />
        <text class="axis-label" :x="MARGIN.left - 6" :y="yOf(tick)" text-anchor="end" dominant-baseline="central">
          {{ tickLabel(tick) }}
        </text>
      </g>

      <!-- Today marker -->
      <g v-if="todayPoint">
        <line class="today-line" :x1="todayPoint.x" :x2="todayPoint.x" :y1="MARGIN.top - 8" :y2="plotBottom" />
        <rect class="today-pill" :x="todayPoint.x - 20" :y="2" width="40" height="16" rx="8" />
        <text class="today-text" :x="todayPoint.x" :y="10" text-anchor="middle" dominant-baseline="central">Today</text>
      </g>

      <!-- Active point guide -->
      <line
        v-if="activePoint"
        class="guide"
        :x1="activePoint.x"
        :x2="activePoint.x"
        :y1="MARGIN.top"
        :y2="plotBottom"
      />

      <!-- Rolling sum: past solid, future lighter and dashed -->
      <path v-if="pastArea" class="area" :d="pastArea" fill="url(#fh-area)" />
      <path v-if="pastPoints.length > 1" class="line" :d="pastLine" />
      <path v-if="futurePoints.length > 1" class="line future" :d="futureLine" />

      <!-- Limit line -->
      <line class="limit-line" :x1="MARGIN.left" :x2="plotRight" :y1="limitY" :y2="limitY" />
      <text class="limit-label" :x="plotRight - 4" :y="limitY - 6" text-anchor="end">
        Limit {{ formatLimit(summary.limit) }} h
      </text>

      <!-- Points -->
      <circle
        v-for="p in plotted"
        :key="p.date"
        class="dot"
        :class="{ future: p.isFuture, today: p.index === todayIndex, active: p.index === activeIndex }"
        :cx="p.x"
        :cy="p.y"
        :r="p.index === activeIndex ? 6 : p.index === todayIndex ? 5 : 3"
      />

      <!-- X axis labels -->
      <g v-for="label in xLabels" :key="label.index">
        <text class="axis-label" :class="{ today: label.isToday }" :x="label.x" :y="plotBottom + 15" text-anchor="middle">
          {{ label.day }}
        </text>
        <text v-if="label.month" class="axis-label month" :x="label.x" :y="plotBottom + 28" text-anchor="middle">
          {{ label.month }}
        </text>
      </g>

      <!-- Hit areas, one column per point -->
      <g
        v-for="p in plotted"
        :key="`hit-${p.date}`"
        class="hit"
        tabindex="0"
        role="button"
        :aria-label="pointLabel(p)"
        @pointerenter="onPointerEnter($event, p.index)"
        @click="activeIndex = p.index"
        @focus="activeIndex = p.index"
        @blur="onBlur(p.index)"
      >
        <rect
          :x="p.x - Math.max(step, 24) / 2"
          :y="MARGIN.top - 8"
          :width="Math.max(step, 24)"
          :height="plotHeight + MARGIN.bottom + 8"
        />
      </g>
    </svg>

    <div
      v-if="activePoint"
      class="tooltip"
      :class="{ below: tooltipBelow }"
      :style="tooltipStyle"
      role="status"
    >
      <p class="tip-date">
        {{ formatLongDate(activePoint.date) }}
        <span v-if="activePoint.isFuture" class="tip-tag">Planned</span>
      </p>
      <p class="tip-row">
        <span>Hours that day</span>
        <strong>{{ formatHours(activePoint.hours) }} h</strong>
      </p>
      <p class="tip-row">
        <span>Rolling sum ({{ summary.windowDays }}d)</span>
        <strong>{{ formatHours(activePoint.rollingSum) }} h</strong>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chart {
  position: relative;
  transition: opacity 0.2s;

  &.loading .svg {
    opacity: 0.5;
  }
}

.svg {
  display: block;
  width: 100%;
  height: auto;
  transition: opacity 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.spinner {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 1;
  color: $text-secondary;
  animation: spin 0.9s linear infinite;
}

.grid {
  stroke: $border;
  stroke-width: 1;
}

.axis-label {
  font-size: 10px;
  fill: $text-secondary;

  &.today {
    font-weight: 800;
    fill: $navy;
  }

  &.month {
    font-weight: 700;
  }
}

.today-line {
  stroke: $navy;
  stroke-width: 1;
  opacity: 0.35;
}

.today-pill {
  fill: $navy;
}

.today-text {
  font-size: 10px;
  font-weight: 700;
  fill: $card;
}

.guide {
  stroke: $text-secondary;
  stroke-width: 1;
  opacity: 0.4;
}

.area-top {
  stop-color: $chart-accent;
  stop-opacity: 0.28;
}

.area-bottom {
  stop-color: $chart-accent;
  stop-opacity: 0;
}

.line {
  fill: none;
  stroke: $chart-accent;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;

  &.future {
    stroke-width: 2;
    stroke-dasharray: 4 4;
    opacity: 0.55;
  }
}

.limit-line {
  stroke: $danger;
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
}

.limit-label {
  font-size: 10px;
  font-weight: 700;
  fill: $danger;
  paint-order: stroke;
  stroke: $card;
  stroke-width: 3px;
  stroke-linejoin: round;
}

.dot {
  fill: $chart-accent;
  stroke: $card;
  stroke-width: 1.5;
  pointer-events: none;

  &.future {
    fill: $card;
    stroke: $chart-accent;
    opacity: 0.6;
  }

  &.today {
    fill: $navy;
    stroke: $card;
    stroke-width: 2;
    opacity: 1;
  }

  &.active {
    fill: $chart-accent;
    stroke: $navy;
    stroke-width: 2;
    opacity: 1;
  }
}

.hit {
  cursor: pointer;
  outline: none;

  rect {
    fill: transparent;
  }
}

.tooltip {
  position: absolute;
  z-index: 2;
  width: 168px;
  padding: 8px 10px;
  border-radius: $radius-card-sm;
  background: $navy;
  color: $card;
  box-shadow: $shadow-card;
  font-size: 12px;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 12px));

  &.below {
    transform: translate(-50%, 12px);
  }
}

.tip-date {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin: 0 0 4px;
  font-weight: 800;
}

.tip-tag {
  padding: 1px 6px;
  border-radius: $radius-pill;
  background: rgba($card, 0.18);
  font-size: 10px;
  font-weight: 700;
}

.tip-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin: 2px 0 0;

  span {
    color: rgba($card, 0.7);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}
</style>
