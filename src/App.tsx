import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { useStoreHydrated } from './store/useHydrated';
import { ScreenShell } from './components/ScreenShell';
import { SkeletonStack } from './components/Skeleton';
import { Home } from './screens/Home';
import { Night } from './screens/Night';
import { Insights } from './screens/Insights';
import { Reflections } from './screens/Reflections';
import { RoutineBuilder } from './screens/RoutineBuilder';
import { Profile } from './screens/Profile';

const ROUTE_DEPTH: Record<string, number> = {
  '/': 0,
  '/night': 0,
  '/insights': 0,
  '/profile': 0,
  '/reflections': 1,
  '/routines/builder': 1,
};

function AppRoutes() {
  const location = useLocation();
  const prevDepth = useRef(0);
  const depth = ROUTE_DEPTH[location.pathname] ?? 0;
  const back = depth < prevDepth.current;
  prevDepth.current = depth;

  return (
    <div key={location.pathname} className={`route-enter${back ? ' route-enter--back' : ''}`}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/night" element={<Night />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/reflections" element={<Reflections />} />
        <Route path="/routines/builder" element={<RoutineBuilder />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

function App() {
  const hydrated = useStoreHydrated();
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinSplashElapsed(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <ThemeProvider>
      {hydrated && minSplashElapsed ? (
        <AppRoutes />
      ) : (
        <ScreenShell tabBar={false}>
          <SkeletonStack />
        </ScreenShell>
      )}
    </ThemeProvider>
  );
}

export default App;
