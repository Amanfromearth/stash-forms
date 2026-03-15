"use client"

import React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Analytics } from "@/lib/analytics"

const PIE_COLORS = ["var(--chart-1)", "var(--chart-4)"]

const foreignChartData = (data: { name: string; value: number }[]) =>
  data.map((d, i) => ({ ...d, fill: PIE_COLORS[i % PIE_COLORS.length] }))

const trendConfig = {
  count: { label: "Submissions", color: "var(--chart-1)" },
} satisfies ChartConfig

const ageConfig = {
  value: { label: "Responses", color: "var(--chart-2)" },
} satisfies ChartConfig

const occupationConfig = {
  value: { label: "Responses", color: "var(--chart-3)" },
} satisfies ChartConfig

const foreignConfig = {
  Yes: { label: "Yes", color: "var(--chart-1)" },
  No: { label: "No", color: "var(--chart-4)" },
} satisfies ChartConfig

const HatchedPattern = ({ config }: { config: ChartConfig }) => (
  <>
    {Object.entries(config).map(([key, val]) => (
      <pattern
        key={key}
        id={`hatched-${key}`}
        x="0"
        y="0"
        width="6.81"
        height="6.81"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
        overflow="visible"
      >
        <g overflow="visible" className="will-change-transform">
          <animateTransform
            attributeName="transform"
            type="translate"
            from="0 0"
            to="6 0"
            dur="1s"
            repeatCount="indefinite"
          />
          <rect width="10" height="10" opacity={0.05} fill={val.color} />
          <rect width="1" height="10" fill={val.color} />
        </g>
      </pattern>
    ))}
  </>
)

const VerticalGradientBar = (
  props: React.SVGProps<SVGRectElement> & { dataKey?: string }
) => {
  const { fill, x, y, width, height, dataKey } = props
  const nx = Number(x ?? 0)
  const nw = Number(width ?? 0)
  const inset = nw * 0.2
  return (
    <>
      <rect
        x={nx + inset}
        y={y}
        width={nw - inset * 2}
        height={height}
        stroke="none"
        fill={`url(#grad-vbar-${dataKey})`}
      />
      <rect
        x={nx + inset}
        y={y}
        width={nw - inset * 2}
        height={2}
        stroke="none"
        fill={fill}
      />
      <defs>
        <linearGradient id={`grad-vbar-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity={0.5} />
          <stop offset="100%" stopColor={fill} stopOpacity={0} />
        </linearGradient>
      </defs>
    </>
  )
}

const HorizontalGradientBar = (
  props: React.SVGProps<SVGRectElement> & { dataKey?: string }
) => {
  const { fill, x, y, width, height, dataKey } = props
  const nw = Number(width ?? 0)
  const nx = Number(x ?? 0)
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="none"
        fill={`url(#grad-hbar-${dataKey})`}
      />
      <rect
        x={nx + nw - 2}
        y={y}
        width={2}
        height={height}
        stroke="none"
        fill={fill}
      />
      <defs>
        <linearGradient id={`grad-hbar-${dataKey}`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={fill} stopOpacity={0.5} />
          <stop offset="100%" stopColor={fill} stopOpacity={0} />
        </linearGradient>
      </defs>
    </>
  )
}

export function AnalyticsCharts({
  total,
  todayCount,
  dailyTrend,
  ageData,
  occupationData,
  foreignInvestData,
  savingsData,
}: Analytics) {
  const [activeArea, setActiveArea] = React.useState<string | null>(null)

  const topSavings = savingsData.reduce(
    (best, cur) => (cur.value > best.value ? cur : best),
    savingsData[0]
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total Responses</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {total.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Today</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {todayCount.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Top Savings Bracket</CardDescription>
            <CardTitle className="text-2xl">
              {topSavings?.name ?? "—"}
            </CardTitle>
            <CardDescription className="tabular-nums">
              {topSavings?.value ?? 0} responses
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submissions Trend</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={trendConfig}
              className="aspect-[2/1] w-full"
            >
              <AreaChart accessibilityLayer data={dailyTrend}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <defs>
                  <HatchedPattern config={trendConfig} />
                  <linearGradient
                    id="hatched-grad-count"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-count)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-count)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  onMouseEnter={() => setActiveArea("count")}
                  onMouseLeave={() => setActiveArea(null)}
                  dataKey="count"
                  type="natural"
                  fill={
                    activeArea === "count"
                      ? "url(#hatched-count)"
                      : "url(#hatched-grad-count)"
                  }
                  fillOpacity={0.4}
                  stroke="var(--color-count)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
            <CardDescription>Respondent age ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={ageConfig} className="aspect-[2/1] w-full">
              <BarChart accessibilityLayer data={ageData}>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  shape={<VerticalGradientBar />}
                  dataKey="value"
                  fill="var(--color-value)"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Occupation</CardTitle>
            <CardDescription>Respondent occupations</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={occupationConfig}
              className="aspect-[2/1] w-full"
            >
              <BarChart
                accessibilityLayer
                data={occupationData}
                layout="vertical"
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={150}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  shape={<HorizontalGradientBar />}
                  dataKey="value"
                  fill="var(--color-value)"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Foreign Investing</CardTitle>
            <CardDescription>
              Have you invested internationally?
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={foreignConfig}
              className="mx-auto aspect-square max-h-[250px] [&_.recharts-text]:fill-background"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" hideLabel />}
                />
                <Pie
                  data={foreignChartData(foreignInvestData)}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={30}
                  cornerRadius={8}
                  paddingAngle={4}
                >
                  <LabelList
                    dataKey="value"
                    stroke="none"
                    fontSize={12}
                    fontWeight={500}
                    fill="currentColor"
                    formatter={(v: number) => v.toString()}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-2 flex justify-center gap-4 text-sm">
              {foreignInvestData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div
                    className="size-2.5 rounded-[2px]"
                    style={{
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                  <span className="text-muted-foreground">
                    {entry.name}{" "}
                    <span className="font-medium text-foreground tabular-nums">
                      {entry.value}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
