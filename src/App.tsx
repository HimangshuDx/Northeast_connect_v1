import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SkeletonCard } from './components/SkeletonCard';
import { AppProvider } from './context/AppContext';

const SituationBoardPage = lazy(() =>
  import('./pages/SituationBoardPage').then((m) => ({ default: m.SituationBoardPage }))
);
const ReportHelpPage = lazy(() =>
  import('./pages/ReportHelpPage').then((m) => ({ default: m.ReportHelpPage }))
);
const ResourcesGuidesPage = lazy(() =>
  import('./pages/ResourcesGuidesPage').then((m) => ({ default: m.ResourcesGuidesPage }))
);
const CoordinatorDeskPage = lazy(() =>
  import('./pages/CoordinatorDeskPage').then((m) => ({ default: m.CoordinatorDeskPage }))
);
const NgoOperationsPage = lazy(() =>
  import('./pages/NgoOperationsPage').then((m) => ({ default: m.NgoOperationsPage }))
);

function RouteFallback() {
  return (
    <div className="space-y-4">
      <SkeletonCard lines={2} />
      <SkeletonCard lines={3} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <AppLayout>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<SituationBoardPage />} />
                <Route path="/citizen" element={<SituationBoardPage />} />
                <Route path="/report" element={<ReportHelpPage />} />
                <Route path="/resources" element={<ResourcesGuidesPage />} />
                <Route path="/ngo" element={<NgoOperationsPage />} />
                <Route path="/coordinator" element={<CoordinatorDeskPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
