import { useState } from 'react';
import { Calendar, CalendarOff } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Pills } from '../components/Pills';
import { CheckRow } from '../components/CheckRow';
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/Button';
import { useAppStore } from '../store/useAppStore';
import { useTodayLog, useStreak, useMoodTrend, useMoodCorrelations, useConsistency7 } from '../store/selectors';
import { useThemeContext } from '../theme/ThemeProvider';
import { useGoogleCalendarContext } from '../lib/GoogleCalendarProvider';
import { formatEventTime } from '../lib/googleCalendar';
import { todayISO, formatHeaderDate, formatHourLabel, hourDecimalToTimeInput, timeInputToHourDecimal } from '../lib/date';
import { quoteOfTheDay, pickOfTheDay } from '../lib/quotes';
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
  const { isNight } = useThemeContext();
  const gcal = useGoogleCalendarContext();

  const morningRoutine = useAppStore((s) => s.morningRoutine);
  const nightRoutine = useAppStore((s) => s.nightRoutine);
  const settings = useAppStore((s) => s.settings);
  const ui = useAppStore((s) => s.ui);
  const reflections = useAppStore((s) => s.reflections);
  const toggleRoutineStep = useAppStore((s) => s.toggleRoutineStep);
  const setDailyField = useAppStore((s) => s.setDailyField);
  const setBuilderType = useAppStore((s) => s.setBuilderType);
  const selectMidday = useAppStore((s) => s.selectMidday);
  const toggleContactInput = useAppStore((s) => s.toggleContactInput);
  const dismissTextPrompt = useAppStore((s) => s.dismissTextPrompt);
  const addContact = useAppStore((s) => s.addContact);
  const removeContact = useAppStore((s) => s.removeContact);
  const upsertReflection = useAppStore((s) => s.upsertReflection);
  const setTargetBedtime = useAppStore((s) => s.setTargetBedtime);

  const [gratitudeDraft, setGratitudeDraft] = useState(log.gratitude ?? '');
  const [newContactText, setNewContactText] = useState('');
  const [editingBedtime, setEditingBedtime] = useState(false);

  const existingReflection = reflections.find((r) => r.date === date)?.text ?? '';
  const [reflectionDraft, setReflectionDraft] = useState(existingReflection);

  const quote = quoteOfTheDay();
  const todaysContact = pickOfTheDay(settings.contacts);
  const doneCountMorning = morningRoutine.filter((s) => log.morningDone[s.id]).length;
  const doneCountNight = nightRoutine.filter((s) => log.nightDone[s.id]).length;

  const showMidday = !isNight && !ui.middayDismissed;
  const showTextPrompt = !isNight && log.dayType === 'rest' && !ui.textPromptDismissed;

  function openTextPrompt() {
    const msg = encodeURIComponent('Good morning! 😊 Thinking of you! Hope you have a great day.');
    const contact = (todaysContact ?? '').trim();
    window.location.href = contact ? `sms:${contact}?&body=${msg}` : `sms:?&body=${msg}`;
    dismissTextPrompt();
  }

  const trendBadge =
    trend === 'up' ? 'Mood trending up' : trend === 'down' ? 'Mood trending down' : trend === 'steady' ? 'Mood steady' : 'Tracking mood';

  const dayInsightSentence =
    correlations.length > 0
      ? `Your mood tends to be better on days you finish "${correlations[0].text}."`
      : 'Log your mood and routine for a few more days to unlock personalized insights here.';

  const nightCorrelation = correlations.find((c) => c.period === 'night');
  const nightInsightSentence = nightCorrelation
    ? `Your mood tends to be better on nights you finish "${nightCorrelation.text}."`
    : 'Keep logging your evening routine and mood — a wind-down insight will show up here once there is enough history.';

  const nightRoutineComplete = nightRoutine.length > 0 && doneCountNight === nightRoutine.length;
  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const onTrackForBedtime = nightRoutineComplete || nowHour < settings.targetBedtimeHour;
  const bedtimeLabel = formatHourLabel(settings.targetBedtimeHour);

  const calendarButton = gcal.supported && (
    <button
      type="button"
      onClick={gcal.connected ? gcal.disconnect : gcal.connect}
      disabled={gcal.connecting}
      style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
    >
      {gcal.connected ? <Calendar size={13} strokeWidth={2} color="var(--accent-mid)" /> : <CalendarOff size={13} strokeWidth={2} color="var(--text2)" />}
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: gcal.connected ? 'var(--accent-mid)' : 'var(--text2)',
          textDecoration: gcal.connected ? 'none' : 'underline',
        }}
      >
        {gcal.connecting ? 'Connecting…' : gcal.connected ? 'Synced with Google Calendar' : 'Connect Google Calendar'}
      </span>
    </button>
  );

  return (
    <ScreenShell>
      <div className="row">
        <div>
          <p className="greeting-name">{formatHeaderDate(now)}</p>
          <h2 className="page-title">{isNight ? 'Good evening' : 'Good morning'}, {settings.displayName}</h2>
        </div>
        {isNight ? <Badge>🌙 Wind down</Badge> : <Badge>🔥 {streak} {streak === 1 ? 'day' : 'days'}</Badge>}
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
              {todaysContact && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text3)' }}>
                  Today&rsquo;s pick: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{todaysContact}</span>
                </p>
              )}
              {ui.showContactInput && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {settings.contacts.map((c, i) => (
                      <span
                        key={c + i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 8px 4px 10px',
                          borderRadius: 999,
                          background: 'var(--accent-tint)',
                          fontSize: 12,
                          color: 'var(--text)',
                        }}
                      >
                        {c}
                        <span onClick={() => removeContact(i)} style={{ cursor: 'pointer', color: 'var(--text2)', fontWeight: 600 }}>
                          ×
                        </span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      style={{ flex: 1, textAlign: 'left' }}
                      placeholder="Add a contact (phone or @handle)"
                      value={newContactText}
                      onChange={(e) => setNewContactText(e.target.value)}
                    />
                    <Button onClick={() => { addContact(newContactText); setNewContactText(''); }}>Add</Button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 10 }}>
                <span onClick={openTextPrompt} style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>
                  Text someone →
                </span>
                <span onClick={toggleContactInput} style={{ fontSize: 11, color: 'var(--text2)', textDecoration: 'underline', cursor: 'pointer' }}>
                  Manage rotation
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
        {!isNight ? (
          <>
            <Card>
              <span className="kicker">Check-in</span>
              <div className="title">How are you feeling?</div>
              <div className="seg-row">
                <Pills ariaLabel="Mood" options={MOOD_SCALE} value={moodValueToLabel(log.mood)} onChange={(label) => setDailyField(date, 'mood', moodLabelToValue(label))} />
              </div>
              <div className="seg-row">
                <span className="seg-label">Energy level</span>
                <Pills ariaLabel="Energy level" options={ENERGY_SCALE} value={energyValueToLabel(log.energy)} onChange={(label) => setDailyField(date, 'energy', label.toLowerCase() as 'low' | 'medium' | 'high')} />
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
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{doneCountMorning} / {morningRoutine.length}</span>
              </div>
              <ProgressBar pct={morningRoutine.length ? doneCountMorning / morningRoutine.length : 0} />
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
                {calendarButton}
              </div>
              <div style={{ marginTop: 12 }}>
                {gcal.connected ? (
                  gcal.events.length ? (
                    gcal.events.map((ev) => (
                      <div className="plan-row" key={ev.id}><span className="plan-time">{formatEventTime(ev)}</span><span className="plan-title">{ev.title}</span></div>
                    ))
                  ) : (
                    <div className="empty-state">Nothing on your calendar right now.</div>
                  )
                ) : (
                  <div className="empty-state">Connect Google Calendar to see your real schedule here.</div>
                )}
              </div>
              {gcal.error && <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--accent)' }}>{gcal.error}</p>}
            </Card>

            <Card>
              <span className="kicker">Insights</span>
              <div className="row" style={{ alignItems: 'flex-end', marginTop: 10 }}>
                <div>
                  <span className="seg-label">Current streak</span>
                  <div className="streak-big">{streak} <small>days</small></div>
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
                <p>{dayInsightSentence}</p>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <span className="kicker">Evening check-in</span>
              <div className="title">How was your day?</div>
              <div className="seg-row">
                <Pills ariaLabel="Evening mood" options={MOOD_SCALE} value={moodValueToLabel(log.eveningMood)} onChange={(label) => setDailyField(date, 'eveningMood', moodLabelToValue(label))} />
              </div>
              <div className="seg-row">
                <span className="seg-label">Energy right now</span>
                <Pills ariaLabel="Evening energy" options={ENERGY_SCALE} value={energyValueToLabel(log.eveningEnergy)} onChange={(label) => setDailyField(date, 'eveningEnergy', label.toLowerCase() as 'low' | 'medium' | 'high')} />
              </div>
            </Card>

            <Card>
              <div className="row">
                <span className="kicker">Night routine</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{doneCountNight} / {nightRoutine.length}</span>
              </div>
              <ProgressBar pct={nightRoutine.length ? doneCountNight / nightRoutine.length : 0} />
              <div style={{ marginTop: 8 }}>
                {nightRoutine.map((step) => (
                  <CheckRow key={step.id} text={step.text} done={!!log.nightDone[step.id]} onToggle={() => toggleRoutineStep('night', step.id)} />
                ))}
                {nightRoutine.length === 0 && <div className="empty-state">No steps yet — add some in the routine builder.</div>}
              </div>
              <Button to="/routines/builder" state={{ from: '/' }} onClick={() => setBuilderType('night')}>
                Edit routine
              </Button>
            </Card>

            <Card>
              <div className="row">
                <span className="kicker">Tomorrow&rsquo;s plan</span>
                {calendarButton}
              </div>
              <div style={{ marginTop: 12 }}>
                {gcal.connected ? (
                  gcal.events.length ? (
                    gcal.events.map((ev) => (
                      <div className="plan-row" key={ev.id}><span className="plan-time">{formatEventTime(ev)}</span><span className="plan-title">{ev.title}</span></div>
                    ))
                  ) : (
                    <div className="empty-state">Nothing on your calendar right now.</div>
                  )
                ) : (
                  <div className="empty-state">Connect Google Calendar to see your real schedule here.</div>
                )}
              </div>
              {gcal.error && <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--accent)' }}>{gcal.error}</p>}
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
                    <div className="streak-big" style={{ fontSize: 26 }}>{bedtimeLabel.time} <small>{bedtimeLabel.ampm}</small></div>
                  )}
                </div>
                <Badge>{onTrackForBedtime ? 'On track' : 'Running late'}</Badge>
              </div>
              <div className="insight-note" style={{ marginTop: 14 }}>
                <Badge onBg>Insight</Badge>
                <p>{nightInsightSentence}</p>
              </div>
            </Card>
          </>
        )}
      </div>
    </ScreenShell>
  );
}
