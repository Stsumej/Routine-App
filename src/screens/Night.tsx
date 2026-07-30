import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Pills } from '../components/Pills';
import { CheckRow } from '../components/CheckRow';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/Button';
import { useAppStore } from '../store/useAppStore';
import { useTodayLog, useMoodCorrelations } from '../store/selectors';
import { todayISO, formatHeaderDate, formatHourLabel, hourDecimalToTimeInput, timeInputToHourDecimal } from '../lib/date';
import { MOOD_SCALE, ENERGY_SCALE, moodLabelToValue, moodValueToLabel, energyValueToLabel } from '../lib/correlation';

export function Night() {
  const date = todayISO();
  const log = useTodayLog();
  const correlations = useMoodCorrelations();

  const nightRoutine = useAppStore((s) => s.nightRoutine);
  const settings = useAppStore((s) => s.settings);
  const reflections = useAppStore((s) => s.reflections);
  const toggleRoutineStep = useAppStore((s) => s.toggleRoutineStep);
  const setDailyField = useAppStore((s) => s.setDailyField);
  const setBuilderType = useAppStore((s) => s.setBuilderType);
  const toggleGcal = useAppStore((s) => s.toggleGcal);
  const upsertReflection = useAppStore((s) => s.upsertReflection);
  const setTargetBedtime = useAppStore((s) => s.setTargetBedtime);
  const [editingBedtime, setEditingBedtime] = useState(false);

  const existingReflection = reflections.find((r) => r.date === date)?.text ?? '';
  const [reflectionDraft, setReflectionDraft] = useState(existingReflection);

  const doneCount = nightRoutine.filter((s) => log.nightDone[s.id]).length;
  const totalCount = nightRoutine.length;
  const nightRoutineComplete = totalCount > 0 && doneCount === totalCount;

  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const onTrack = nightRoutineComplete || nowHour < settings.targetBedtimeHour;
  const bedtimeLabel = formatHourLabel(settings.targetBedtimeHour);

  const nightCorrelation = correlations.find((c) => c.period === 'night');
  const insightSentence = nightCorrelation
    ? `Your mood tends to be better on nights you finish "${nightCorrelation.text}."`
    : 'Keep logging your evening routine and mood — a wind-down insight will show up here once there is enough history.';

  return (
    <ScreenShell>
      <div className="row">
        <div>
          <p className="greeting-name">{formatHeaderDate(now)}</p>
          <h2 className="page-title">Good evening, {settings.displayName}</h2>
        </div>
        <Badge>🌙 Wind down</Badge>
      </div>

      <div className="stack">
        <Card>
          <span className="kicker">Evening check-in</span>
          <div className="title">How was your day?</div>
          <div className="seg-row">
            <Pills
              ariaLabel="Evening mood"
              options={MOOD_SCALE}
              value={moodValueToLabel(log.eveningMood)}
              onChange={(label) => setDailyField(date, 'eveningMood', moodLabelToValue(label))}
            />
          </div>
          <div className="seg-row">
            <span className="seg-label">Energy right now</span>
            <Pills
              ariaLabel="Evening energy"
              options={ENERGY_SCALE}
              value={energyValueToLabel(log.eveningEnergy)}
              onChange={(label) => setDailyField(date, 'eveningEnergy', label.toLowerCase() as 'low' | 'medium' | 'high')}
            />
          </div>
        </Card>

        <Card>
          <div className="row">
            <span className="kicker">Night routine</span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              {doneCount} / {totalCount}
            </span>
          </div>
          <ProgressBar pct={totalCount ? doneCount / totalCount : 0} />
          <div style={{ marginTop: 8 }}>
            {nightRoutine.map((step) => (
              <CheckRow key={step.id} text={step.text} done={!!log.nightDone[step.id]} onToggle={() => toggleRoutineStep('night', step.id)} />
            ))}
            {nightRoutine.length === 0 && <div className="empty-state">No steps yet — add some in the routine builder.</div>}
          </div>
          <Button to="/routines/builder" state={{ from: '/night' }} onClick={() => setBuilderType('night')}>
            Edit routine
          </Button>
        </Card>

        <Card>
          <div className="row">
            <span className="kicker">Tomorrow&rsquo;s plan</span>
            <button
              type="button"
              onClick={toggleGcal}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
            >
              <Calendar size={13} strokeWidth={2} color={settings.gcalConnected ? 'var(--accent-mid)' : 'var(--text2)'} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: settings.gcalConnected ? 'var(--accent-mid)' : 'var(--text2)',
                  textDecoration: settings.gcalConnected ? 'none' : 'underline',
                }}
              >
                {settings.gcalConnected ? 'Synced with Google Calendar' : 'Connect Google Calendar'}
              </span>
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="plan-row"><span className="plan-time">8:30</span><span className="plan-title">Morning routine</span></div>
            <div className="plan-row"><span className="plan-time">9:00</span><span className="plan-title">Team standup</span></div>
            <div className="plan-row"><span className="plan-time">2:00</span><span className="plan-title">Doctor&rsquo;s appointment</span></div>
          </div>
          {settings.gcalConnected && (
            <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--text2)' }}>
              Demo only — showing sample events. Google Calendar isn&rsquo;t actually connected yet.
            </p>
          )}
        </Card>

        <Card>
          <span className="kicker">Reflection</span>
          <div className="title">What went well today?</div>
          <textarea
            className="input"
            placeholder="Finished the routine builder review earlier than planned..."
            value={reflectionDraft}
            onChange={(e) => setReflectionDraft(e.target.value)}
            onBlur={() => upsertReflection(date, reflectionDraft)}
          />
        </Card>

        <Card>
          <span className="kicker">Bedtime goal</span>
          <div className="row" style={{ alignItems: 'flex-end', marginTop: 10 }}>
            <div>
              <div className="row" style={{ gap: 8, justifyContent: 'flex-start' }}>
                <span className="seg-label">Target bedtime</span>
                <button
                  type="button"
                  onClick={() => setEditingBedtime((v) => !v)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontSize: 11, color: 'var(--accent)', textDecoration: 'underline' }}
                >
                  {editingBedtime ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingBedtime ? (
                <input
                  className="input"
                  type="time"
                  style={{ width: 'auto', marginTop: 6, textAlign: 'left' }}
                  value={hourDecimalToTimeInput(settings.targetBedtimeHour)}
                  onChange={(e) => e.target.value && setTargetBedtime(timeInputToHourDecimal(e.target.value))}
                />
              ) : (
                <div className="streak-big" style={{ fontSize: 26 }}>
                  {bedtimeLabel.time} <small>{bedtimeLabel.ampm}</small>
                </div>
              )}
            </div>
            <Badge>{onTrack ? 'On track' : 'Running late'}</Badge>
          </div>
          <div className="insight-note" style={{ marginTop: 14 }}>
            <Badge onBg>Insight</Badge>
            <p>{insightSentence}</p>
          </div>
        </Card>
      </div>
    </ScreenShell>
  );
}
