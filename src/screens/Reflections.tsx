import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/Card';
import { useAppStore } from '../store/useAppStore';
import { useReflectionArchive } from '../store/selectors';

const DEBOUNCE_MS = 300;

export function Reflections() {
  const storedQuery = useAppStore((s) => s.ui.archiveSearch);
  const setArchiveSearch = useAppStore((s) => s.setArchiveSearch);
  const [inputValue, setInputValue] = useState(storedQuery);

  useEffect(() => {
    const t = setTimeout(() => setArchiveSearch(inputValue), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [inputValue, setArchiveSearch]);

  const { groups, filtered } = useReflectionArchive(storedQuery);
  const isSearching = storedQuery.trim().length > 0;

  return (
    <ScreenShell tabBar={false}>
      <div className="back-row">
        <Link to="/insights" className="back-btn" aria-label="Back to Insights">
          <ChevronLeft size={22} strokeWidth={2} />
        </Link>
        <h2 className="page-title" style={{ fontSize: 20, margin: 0 }}>Reflections</h2>
      </div>

      <input
        className="search-input"
        style={{ marginTop: 18 }}
        placeholder="Search reflections..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />

      <div className="stack" style={{ marginTop: 16 }}>
        {isSearching ? (
          filtered.length === 0 ? (
            <div className="empty-state">No reflections found</div>
          ) : (
            <Card>
              {filtered.map((r) => (
                <div className="reflection-item" key={r.date}>
                  <div className="reflection-date">{r.dateLabel}</div>
                  <div className="reflection-text">{r.text}</div>
                </div>
              ))}
            </Card>
          )
        ) : groups.length === 0 ? (
          <div className="empty-state">No reflections yet. Write one from the Night screen.</div>
        ) : (
          groups.map((g) => (
            <div key={g.label}>
              <span className="kicker">{g.label}</span>
              <Card style={{ marginTop: 8 }}>
                {g.items.map((r) => (
                  <div className="reflection-item" key={r.date}>
                    <div className="reflection-date">{r.dateLabel}</div>
                    <div className="reflection-text">{r.text}</div>
                  </div>
                ))}
              </Card>
            </div>
          ))
        )}
      </div>
    </ScreenShell>
  );
}
