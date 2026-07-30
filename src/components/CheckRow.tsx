import { Check } from 'lucide-react';

export function CheckRow({ text, done, onToggle }: { text: string; done: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="check-row" onClick={onToggle} aria-pressed={done}>
      <span className={`check-box${done ? ' done' : ''}`}>
        {done && <Check size={12} strokeWidth={3} color="var(--text-on-accent)" />}
      </span>
      <span className={`check-text${done ? ' done' : ''}`}>{text}</span>
    </button>
  );
}
