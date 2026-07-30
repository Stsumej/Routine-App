import { Droplet, Activity, BedDouble, List, Sun, BatteryCharging, Lightbulb, Book, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/Card';
import { useThemeContext } from '../theme/ThemeProvider';
import { useConsistency7, useEnergy7, useMoodCorrelations, useRecentReflections } from '../store/selectors';
import { buildEnergyPaths } from '../lib/energyChart';
import { inferMoodIcon, type MoodIcon } from '../lib/correlation';

const RING_RADIUS = 27;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const ICONS: Record<MoodIcon, typeof Droplet> = {
  water: Droplet,
  activity: Activity,
  bed: BedDouble,
  list: List,
  sun: Sun,
  battery: BatteryCharging,
  bulb: Lightbulb,
  book: Book,
  moon: Moon,
};

function DayIllustration() {
  return (
    <svg className="illustration" viewBox="0 0 390 170" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7EEDF" />
          <stop offset="1" stopColor="#E8D2B0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="390" height="170" fill="url(#skyDay)" />
      <circle cx="320" cy="46" r="30" fill="#E3A468" />
      <path d="M52 42 q8 -10 16 0 q8 10 16 0" stroke="#B98F5E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M90 58 q7 -9 14 0 q7 9 14 0" stroke="#B98F5E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M-10 150 Q80 95 195 130 Q290 155 400 120 L400 170 L-10 170 Z" fill="#D9C39D" />
      <path d="M-10 160 Q100 120 210 148 Q310 172 400 140 L400 170 L-10 170 Z" fill="#A8B48A" />
      <path d="M-10 170 Q90 140 200 162 Q300 180 400 155 L400 170 L-10 170 Z" fill="#7C8F63" />
      <path
        d="M18 170 C16 150 26 138 30 170 M30 170 C28 145 42 132 46 170 M46 170 C44 150 54 140 58 170"
        fill="none"
        stroke="#5B6B45"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NightIllustration() {
  return (
    <svg className="illustration" viewBox="0 0 390 170" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A4A52" />
          <stop offset="1" stopColor="#16232B" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="390" height="170" fill="url(#skyNight)" />
      <circle cx="320" cy="46" r="28" fill="#E8E3D3" />
      <circle cx="310" cy="38" r="24" fill="#1C2830" />
      <circle cx="55" cy="35" r="1.6" fill="#EEF1F2" />
      <circle cx="80" cy="55" r="1.4" fill="#EEF1F2" />
      <circle cx="110" cy="30" r="1.8" fill="#EEF1F2" />
      <circle cx="140" cy="50" r="1.3" fill="#EEF1F2" />
      <circle cx="200" cy="28" r="1.5" fill="#EEF1F2" />
      <path d="M-10 150 Q80 95 195 130 Q290 155 400 120 L400 170 L-10 170 Z" fill="#3F5964" />
      <path d="M-10 160 Q100 120 210 148 Q310 172 400 140 L400 170 L-10 170 Z" fill="#2E4550" />
      <path d="M-10 170 Q90 140 200 162 Q300 180 400 155 L400 170 L-10 170 Z" fill="#1C2830" />
      <path
        d="M18 170 C16 150 26 138 30 170 M30 170 C28 145 42 132 46 170 M46 170 C44 150 54 140 58 170"
        fill="none"
        stroke="#0F1B22"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Insights() {
  const { isNight } = useThemeContext();
  const consistency7 = useConsistency7();
  const energy7 = useEnergy7();
  const correlations = useMoodCorrelations();
  const recentReflections = useRecentReflections(7);

  const energyPaths = buildEnergyPaths(energy7);
  const completedDays = consistency7.filter((d) => d.done).length;
  const headline =
    completedDays >= 2
      ? `You've completed both routines on ${completedDays} of the last 7 days.`
      : "Log your routines and mood for a few more days to see patterns here.";

  return (
    <ScreenShell flush>
      {isNight ? <NightIllustration /> : <DayIllustration />}
      <div style={{ marginTop: -4 }}>
        <h2 className="page-title" style={{ margin: 0 }}>Insights</h2>
        <p className="quote-text" style={{ margin: '8px 0 0', color: 'var(--text)' }}>{headline}</p>

        <div className="stack">
          <Card>
            <span className="kicker">Consistency</span>
            <div className="consistency-grid">
              {consistency7.map((d) => (
                <div style={{ flex: 1 }} key={d.date}>
                  <div className={`day-cell${d.done ? ' done' : ''}`} />
                  <div className="day-cell-label">{d.label}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <span className="kicker">Energy, past 7 days</span>
            <svg viewBox="0 0 280 90" style={{ width: '100%', height: 90, marginTop: 10 }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
                  <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={energyPaths.area} fill="url(#energyFill)" />
              <path d={energyPaths.line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Card>

          <Card>
            <span className="kicker">Mood &amp; your routine</span>
            <p style={{ margin: '6px 0 4px', fontSize: 12.5, color: 'var(--text2)' }}>Steps most linked to a better mood, past 3 weeks</p>
            {correlations.length === 0 ? (
              <div className="empty-state">Not enough data yet — log your mood and routine on the same day to build this up.</div>
            ) : (
              <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                {correlations.slice(0, 3).map((m) => {
                  const Icon = ICONS[inferMoodIcon(m.text)];
                  const dash = `${(m.fillFraction * CIRCUMFERENCE).toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`;
                  return (
                    <div key={m.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
                      <div style={{ position: 'relative', width: 66, height: 66, flex: 'none' }}>
                        <svg width="66" height="66" viewBox="0 0 64 64" style={{ position: 'absolute', inset: 0 }}>
                          <circle cx="32" cy="32" r={RING_RADIUS} fill="none" stroke="var(--divider)" strokeWidth="6" />
                          <circle
                            cx="32"
                            cy="32"
                            r={RING_RADIUS}
                            fill="none"
                            stroke="var(--accent)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={dash}
                            transform="rotate(-90 32 32)"
                          />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={22} strokeWidth={2} color="var(--accent)" />
                        </div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>
                        {m.delta >= 0 ? '+' : ''}
                        {m.delta.toFixed(1)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.3 }}>{m.text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <div style={{ height: 1, background: 'var(--divider)' }} />

          <Card>
            <div className="row">
              <span className="kicker">Reflections</span>
              <Link to="/reflections" className="see-all">See all →</Link>
            </div>
            <div className="seg-label" style={{ marginTop: 6 }}>Past 7 days</div>
            <div style={{ marginTop: 8 }}>
              {recentReflections.length === 0 ? (
                <div className="empty-state">No reflections yet this week.</div>
              ) : (
                recentReflections.map((r) => (
                  <div className="reflection-item" key={r.date}>
                    <div className="reflection-date">{r.dateLabel}</div>
                    <div className="reflection-text">{r.text}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </ScreenShell>
  );
}
