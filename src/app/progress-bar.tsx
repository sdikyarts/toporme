type ProgressBarProps = {
  percent: number;
  label: string;
};

export default function ProgressBar({ percent, label }: ProgressBarProps) {
  const value = Math.max(0, Math.min(100, percent));

  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div className="progress-bar-bar">
        <div className="progress-bar-fill" style={{ width: `${value}%` }} />
      </div>
      <div className="progress-bar-text">{`${value}%`}</div>
    </div>
  );
}
