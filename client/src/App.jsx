import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import SiteLayout from './components/SiteLayout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import DroneDetailPage from './pages/DroneDetailPage.jsx';
import InstructionsPage from './pages/InstructionsPage.jsx';
import InfoPage from './pages/InfoPages.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { useT } from './i18n/index.js';

// The simulator is the heaviest part, so it loads only when someone opens it.
const SimulatorPage = lazy(() => import('./pages/SimulatorPage.jsx'));

function Sim({ mode }) {
  const t = useT();
  return (
    <Suspense fallback={<div className="fullscreen-msg" role="status">{t('sim.loadingSim')}</div>}>
      <SimulatorPage mode={mode} />
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/simulator/:id" element={<Sim mode="free" />} />
      <Route path="/challenge/:id" element={<Sim mode="challenge" />} />
      <Route element={<SiteLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="drones" element={<CatalogPage />} />
        <Route path="drones/:id" element={<DroneDetailPage />} />
        <Route path="how-to-fly" element={<InstructionsPage />} />
        <Route path="terms" element={<InfoPage page="terms" />} />
        <Route path="privacy" element={<InfoPage page="privacy" />} />
        <Route path="troubleshooting" element={<InfoPage page="troubleshooting" />} />
        <Route path="contact" element={<InfoPage page="contact" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
