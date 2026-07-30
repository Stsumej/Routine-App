export function Pills<T extends string>({ options, value, onChange, ariaLabel }: { options: readonly T[]; value: T | null; onChange: (v: T) => void; ariaLabel?: string }) {
  return (
    <div className="pills" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={value === opt}
          className={`pill${value === opt ? ' selected' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
