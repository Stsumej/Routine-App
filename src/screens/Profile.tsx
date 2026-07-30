import { Calendar, CalendarOff } from 'lucide-react';
import { ScreenShell } from '../components/ScreenShell';
import { Card } from '../components/Card';
import { useAppStore } from '../store/useAppStore';
import { useThemeContext } from '../theme/ThemeProvider';
import type { ThemeMode } from '../theme/tokens';
import { hourDecimalToTimeInput, timeInputToHourDecimal } from '../lib/date';

const THEME_MODES: { value: ThemeMode; label: string; hint: string }[] = [
  { value: 'automatic', label: 'Automatic', hint: 'Follows real sunset at your location (falls back to 7:00 PM if location is unavailable).' },
  { value: 'always-light', label: 'Always light', hint: 'Pins the Quiet ritual (day) palette.' },
  { value: 'always-dusk', label: 'Always dusk', hint: 'Pins the Deep water (night) palette.' },
];

export function Profile() {
  const settings = useAppStore((s) => s.settings);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const setGoToContact = useAppStore((s) => s.setGoToContact);
  const toggleGcal = useAppStore((s) => s.toggleGcal);
  const setTargetBedtime = useAppStore((s) => s.setTargetBedtime);
  const theme = useThemeContext();

  return (
    <ScreenShell>
      <h2 className="page-title" style={{ margin: '0 0 4px' }}>Profile</h2>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text2)' }}>{settings.displayName}</p>

      <div className="stack">
        <Card>
          <span className="kicker">Appearance</span>
          <div className="title">Theme</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {THEME_MODES.map((m) => (
              <label key={m.value} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="themeMode"
                  checked={settings.themeMode === m.value}
                  onChange={() => setThemeMode(m.value)}
                  style={{ marginTop: 3, accentColor: 'var(--accent)' }}
                />
                <span>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{m.label}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{m.hint}</span>
                </span>
              </label>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 14, marginBottom: 0 }}>{theme.debugLabel}</p>
        </Card>

        <Card>
          <span className="kicker">Text-someone nudge</span>
          <div className="title">Go-to contact</div>
          <input
            className="input"
            style={{ width: '100%', textAlign: 'left' }}
            placeholder="Phone number or @handle"
            value={settings.goToContact}
            onChange={(e) => setGoToContact(e.target.value)}
          />
        </Card>

        <Card>
          <span className="kicker">Wind down</span>
          <div className="title">Target bedtime</div>
          <input
            className="input"
            type="time"
            style={{ width: 'auto', textAlign: 'left' }}
            value={hourDecimalToTimeInput(settings.targetBedtimeHour)}
            onChange={(e) => e.target.value && setTargetBedtime(timeInputToHourDecimal(e.target.value))}
          />
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, marginBottom: 0 }}>
            Drives the &ldquo;On track&rdquo; badge on the Night screen&rsquo;s bedtime goal card.
          </p>
        </Card>

        <Card>
          <span className="kicker">Integrations</span>
          <div className="row" style={{ marginTop: 6 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Google Calendar</div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text2)', maxWidth: 240 }}>
                Not yet functional — this is a demo toggle only. Connecting it here does not sync real events.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleGcal}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', flex: 'none' }}
            >
              {settings.gcalConnected ? <Calendar size={18} color="var(--accent-mid)" /> : <CalendarOff size={18} color="var(--text2)" />}
            </button>
          </div>
        </Card>
      </div>
    </ScreenShell>
  );
}
