export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="progress-track" style={{ marginTop: 12 }}>
      <div className="progress-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
    </div>
  );
}
