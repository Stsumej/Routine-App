import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronUp, ChevronDown, X, GripVertical } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAppStore } from '../store/useAppStore';
import type { RoutinePeriod } from '../store/types';

export function RoutineBuilder() {
  const location = useLocation();
  const backTo = (location.state as { from?: string } | null)?.from ?? '/';

  const builderType = useAppStore((s) => s.ui.builderType);
  const setBuilderType = useAppStore((s) => s.setBuilderType);
  const morningRoutine = useAppStore((s) => s.morningRoutine);
  const nightRoutine = useAppStore((s) => s.nightRoutine);
  const addStep = useAppStore((s) => s.addStep);
  const removeStep = useAppStore((s) => s.removeStep);
  const moveStep = useAppStore((s) => s.moveStep);
  const reorderSteps = useAppStore((s) => s.reorderSteps);

  const list = builderType === 'morning' ? morningRoutine : nightRoutine;
  const [newStepText, setNewStepText] = useState('');

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (dragIndex === null) return;
    function handleMove(e: PointerEvent) {
      let nearestIndex = 0;
      let nearestDist = Infinity;
      rowRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(e.clientY - mid);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIndex = i;
        }
      });
      setDragIndex((current) => {
        if (current !== null && nearestIndex !== current) {
          reorderSteps(builderType, current, nearestIndex);
          return nearestIndex;
        }
        return current;
      });
    }
    function handleUp() {
      setDragIndex(null);
    }
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragIndex, builderType, reorderSteps]);

  function handleAdd() {
    if (!newStepText.trim()) return;
    addStep(builderType, newStepText);
    setNewStepText('');
  }

  return (
    <ScreenShell tabBar={false}>
      <div className="back-row">
        <Link to={backTo} className="back-btn" aria-label="Back">
          <ChevronLeft size={22} strokeWidth={2} />
        </Link>
        <h2 className="page-title" style={{ fontSize: 20, margin: 0 }}>Edit routine</h2>
      </div>

      <div className="seg-row" style={{ marginTop: 18 }}>
        <div className="pills">
          {(['morning', 'night'] as RoutinePeriod[]).map((period) => (
            <button
              key={period}
              type="button"
              className={`pill${builderType === period ? ' selected' : ''}`}
              onClick={() => setBuilderType(period)}
            >
              {period === 'morning' ? 'Morning' : 'Night'}
            </button>
          ))}
        </div>
      </div>

      <div className="stack" style={{ marginTop: 16 }}>
        <Card>
          <span className="kicker">{builderType === 'morning' ? 'Morning routine' : 'Night routine'}</span>
          <div style={{ marginTop: 6 }}>
            {list.map((item, i) => (
              <div
                className="check-row"
                key={item.id}
                style={{ gap: 10, cursor: 'default', opacity: dragIndex === i ? 0.5 : 1 }}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
              >
                <span
                  style={{ cursor: 'grab', color: 'var(--text3)', flex: 'none', display: 'flex', touchAction: 'none' }}
                  title="Drag to reorder"
                  onPointerDown={() => setDragIndex(i)}
                >
                  <GripVertical size={16} strokeWidth={2} />
                </span>
                <span className="check-text" style={{ flex: 1 }}>{item.text}</span>
                <button
                  type="button"
                  onClick={() => moveStep(builderType, item.id, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text2)', display: 'flex', opacity: i === 0 ? 0.35 : 1 }}
                >
                  <ChevronUp size={15} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(builderType, item.id, 1)}
                  disabled={i === list.length - 1}
                  aria-label="Move down"
                  style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text2)', display: 'flex', opacity: i === list.length - 1 ? 0.35 : 1 }}
                >
                  <ChevronDown size={15} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => removeStep(builderType, item.id)}
                  aria-label="Remove"
                  style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--accent)', display: 'flex' }}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            ))}
            {list.length === 0 && <div className="empty-state">No steps yet — add your first below.</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--divider)' }}>
            <input
              className="input"
              style={{ flex: 1, width: 'auto', textAlign: 'left' }}
              placeholder="Add a step..."
              value={newStepText}
              onChange={(e) => setNewStepText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button type="button" className="btn btn--auto" onClick={handleAdd}>Add</button>
          </div>
        </Card>
      </div>

      <Button to={backTo} primary style={{ marginTop: 20 }}>Done</Button>
    </ScreenShell>
  );
}
