interface ProgressBarProps {
  current: number // 1-based current question index
  total: number // total number of questions
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100)
  return (
    <div className="fixed top-0 right-0 left-0 z-50 h-1 bg-muted">
      <div
        className="h-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Question ${current} of ${total}`}
      />
    </div>
  )
}
