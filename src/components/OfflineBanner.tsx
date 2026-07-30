import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../lib/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="offline-banner">
      <WifiOff size={13} strokeWidth={2} />
      You&rsquo;re offline — showing your last saved data.
    </div>
  );
}
