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
import { useTodayLog, useStreak, useMoodTrend, useMoodCorrelations, useConsistency7 } from '../store/selectors';
import { todayISO, formatHeaderDate } from '../lib/date';
import { quoteOfTheDay } from '../lib/quotes';
import { MOOD_SCALE, ENERGY_SCALE, moodLabelToValue, moodValueToLabel, energyValueToLabel } from '../lib/correlation';
import type { DayType } from '../store/types';

const DAY_TYPES: { value: DayType; label: string }[] = [
  { value: 'rest', label: 'Rest day' },
  { value: 'workout', label: 'Workout day' },
];

export function Home() {
  const date = todayISO();
  const log = useTodayLog();
  const streak = useStreak();
  const trend = useMoodTrend();
  const correlations = useMoodCorrelations();
  const consistency7 = useConsistency7();

  const morningRoutine = useAppStore((s) => s.morningRoutine);
  const settings = useAppStore((s) => s.settings);
  const ui = useAppStore((s) => s.ui);
  const toggleRoutineStep = useAppStore((s) => s.toggleRoutineStep);
  const setDailyField = useAppStore((s) => s.setDailyField);
  const setBuilderType = useAppStore((s) => s.setBuilderType);
  const selectMidday = useAppStore((s) => s.selectMidday);
  const toggleContactInput = useAppStore((s) => s.toggleContactInput);
  const dismissTextPrompt = useAppStore((s) => s.dismissTextPrompt);
  const setGoToContact = useAppStore((s) => s.setGoToContact);
  const toggleGcal = useAppStore((s) => s.toggleGcal);

  const [gratitudeDraft, setGratitudeDraft] = useState(log.gratitude ?? '');

  const quote = quoteOfTheDay();
  const doneCount = morningRoutine.filter((s) => log.morningDone[s.id]).length;
  const totalCount = morningRoutine.length;

  const showMidday = !ui.middayDismissed;
  const showTextPrompt = log.dayType === 'rest' && !ui.textPromptDismissed;

  function openTextPrompt() {
    const msg = encodeURIComponent('Good morning! 😊 Thinking of you! Hope you have a great day.');
    const contact = settings.goToContact.trim();
    window.location.href = contact ? `sms:${contact}?&body=${msg}` : `sms:?&body=${msg}`;
    dismissTextPrompt();
  }

  const trendBadge =
    trend === 'up' ? 'Mood trending up' : trend === 'down' ? 'Mood trending down' : trend === 'steady' ? 'Mood steady' : 'Tracking mood';

  const insightSentence =
    correlations.length > 0
      ? `Your mood tends to be better on days you finish "${correlations[0].text}."`
      : 'Log your mood and routine for a few more days to unlock personalized insights here.';

  return (
    <ScreenShell>
      <div className="row">
        <div>
          <p className="greeting-name">{formatHeaderDate(new Date())}</p>
          <h2 className="page-title">Good morning, {settings.displayName}</h2>
        </div>
        <Badge>🔥 {streak} {streak === 1 ? 'day' : 'days'}</Badge>
      </div>

      {showMidday && (
        <>
          <Card style={{ marginTop: 20 }}>
            <span className="kicker">Daily motivation</span>
            <p className="quote-text" style={{ margin: '10px 0 6px', color: 'var(--text)' }}>
              &ldquo;{quote.text}&rdquo;
            </p>
            <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.3px', textTransform: 'uppercase', color: 'var(--text2)' }}>
              — {quote.author}
            </span>
          </Card>
          <div className="midday">
            <span className="midday-label">How&rsquo;s the day going?</span>
            <button type="button" className="pill" onClick={() => selectMidday('dip')}>Energy dip</button>
            <button type="button" className="pill" onClick={() => selectMidday('track')}>On track</button>
            <button type="button" className="pill" onClick={() => selectMidday('crushing')}>Crushing it</button>
          </div>
        </>
      )}

      {showTextPrompt && (
        <Card compact style={{ marginTop: 16 }}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)' }}>Text someone good morning</div>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text2)' }}>A quick hello can start the day better than a scroll.</p>
              {ui.showContactInput && (
                <input
                  className="input"
                  style={{ width: '100%', marginTop: 10, textAlign: 'left' }}
                  placeholder="Go-to contact (phone or @handle, optional)"
                  value={settings.goToContact}
                  onChange={(e) => setGoToContact(e.target.value)}
                />
              )}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 10 }}>
                <span onClick={openTextPrompt} style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>
                  Text someone →
                </span>
                <span onClick={toggleContactInput} style={{ fontSize: 11, color: 'var(--text2)', textDecoration: 'underline', cursor: 'pointer' }}>
                  Set go-to contact
                </span>
                <span onClick={dismissTextPrompt} style={{ fontSize: 11, color: 'var(--text2)', cursor: 'pointer', marginLeft: 'auto' }}>
                  Dismiss
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="stack">
        <Card>
          <span className="kicker">Check-in</span>
          <div className="title">How are you feeling?</div>
          <div className="seg-row">
            <Pills
              ariaLabel="Mood"
              options={MOOD_SCALE}
              value={moodValueToLabel(log.mood)}
              onChange={(label) => setDailyField(date, 'mood', moodLabelToValue(label))}
            />
          </div>
          <div className="seg-row">
            <span className="seg-label">Energy level</span>
            <Pills
              ariaLabel="Energy level"
              options={ENERGY_SCALE}
              value={energyValueToLabel(log.energy)}
              onChange={(label) => setDailyField(date, 'energy', label.toLowerCase() as 'low' | 'medium' | 'high')}
            />
          </div>
          <div className="seg-row">
            <span className="seg-label">Today</span>
            <Pills ariaLabel="Day type" options={DAY_TYPES.map((d) => d.label)} value={DAY_TYPES.find((d) => d.value === log.dayType)?.label ?? null} onChange={(label) => setDailyField(date, 'dayType', DAY_TYPES.find((d) => d.label === label)!.value)} />
          </div>
          <div className="seg-row">
            <span className="seg-label">Sleep last night</span>
            <div className="sleep-row">
              <input
                className="input"
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={log.sleepHours ?? ''}
                onChange={(e) => setDailyField(date, 'sleepHours', e.target.value === '' ? undefined : Number(e.target.value))}
              />
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>hours</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="row">
            <span className="kicker">Morning routine</span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              {doneCount} / {totalCount}
            </span>
          </div>
          <ProgressBar pct={totalCount ? doneCount / totalCount : 0} />
          <div style={{ marginTop: 8 }}>
            {morningRoutine.map((step) => (
              <CheckRow key={step.id} text={step.text} done={!!log.morningDone[step.id]} onToggle={() => toggleRoutineStep('morning', step.id)} />
            ))}
            {morningRoutine.length === 0 && <div className="empty-state">No steps yet — add some in the routine builder.</div>}
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--divider)' }}>
            <span className="seg-label">One thing you&rsquo;re grateful for today</span>
            <textarea
              className="input"
              style={{ marginTop: 8 }}
              placeholder="Slept well and woke up before my alarm..."
              value={gratitudeDraft}
              onChange={(e) => setGratitudeDraft(e.target.value)}
              onBlur={() => setDailyField(date, 'gratitude', gratitudeDraft)}
            />
          </div>
          <Button to="/routines/builder" state={{ from: '/' }} onClick={() => setBuilderType('morning')}>
            Edit routine
          </Button>
        </Card>

        <Card>
          <div className="row">
            <span className="kicker">Today&rsquo;s plan</span>
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
            <div className="plan-row"><span className="plan-time">9:00</span><span className="plan-title">Team standup</span></div>
            <div className="plan-row"><span className="plan-time">1:00</span><span className="plan-title">Finish routine builder review</span></div>
            <div className="plan-row"><span className="plan-time">6:30</span><span className="plan-title">Evening walk</span></div>
          </div>
          {settings.gcalConnected && (
            <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--text2)' }}>
              Demo only — showing sample events. Google Calendar isn&rsquo;t actually connected yet.
            </p>
          )}
        </Card>

        <Card>
          <span className="kicker">Insights</span>
          <div className="row" style={{ alignItems: 'flex-end', marginTop: 10 }}>
            <div>
              <span className="seg-label">Current streak</span>
              <div className="streak-big">
                {streak} <small>days</small>
              </div>
            </div>
            <Badge>{trendBadge}</Badge>
          </div>
          <div className="chart">
            {consistency7.map((d) => (
              <div className="bar-wrap" key={d.date}>
                <div className="bar" style={{ height: `${Math.max(6, Math.round(d.ratio * 100))}%`, background: d.date === date ? 'var(--accent)' : undefined }} />
                <span className="bar-label">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="insight-note">
            <Badge onBg>Insight</Badge>
            <p>{insightSentence}</p>
          </div>
        </Card>
      </div>
    </ScreenShell>
  );
}
