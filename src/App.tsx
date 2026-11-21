import { lazy, Suspense } from 'react';
import { MotionConfig } from 'motion/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SkeletonCard } from './components/SkeletonCard';
import { AppProvider } from './context/AppContext';

const RoleSelectionPage = lazy(() =>
  import('./pages/RoleSelectionPage').then((m) => ({ default: m.RoleSelectionPage }))
);
const OrganizationLoginPage = lazy(() =>
  import('./pages/OrganizationLoginPage').then((m) => ({ default: m.OrganizationLoginPage }))
);
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

function StandaloneFallback() {
  return (
    <div className="min-h-screen ne-canvas p-6">
      <div className="mx-auto max-w-4xl">
        <RouteFallback />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ErrorBoundary>
        <BrowserRouter>
          <AppProvider>
            <Routes>
            <Route
              path="/"
              element={
                <Suspense fallback={<StandaloneFallback />}>
                  <RoleSelectionPage />
                </Suspense>
              }
            />
            <Route
              path="/login"
              element={
                <Suspense fallback={<StandaloneFallback />}>
                  <OrganizationLoginPage />
                </Suspense>
              }
            />
            <Route
              path="/*"
              element={
                <AppLayout>
                  <Suspense fallback={<RouteFallback />}>
                    <Routes>
                      <Route path="/board" element={<SituationBoardPage />} />
                      <Route path="/citizen" element={<SituationBoardPage />} />
                      <Route path="/report" element={<ReportHelpPage />} />
                      <Route path="/resources" element={<ResourcesGuidesPage />} />
                      <Route
                        path="/ngo"
                        element={
                          <ProtectedRoute
                            allowedRoles={['NGO_MEMBER', 'VOLUNTEER', 'COORDINATOR', 'ADMIN']}
                            featureLabel="Relief Operations Dashboard"
                          >
                            <NgoOperationsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/coordinator"
                        element={
                          <ProtectedRoute
                            allowedRoles={['COORDINATOR', 'ADMIN']}
                            featureLabel="Coordinator Desk"
                          >
                            <CoordinatorDeskPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </AppLayout>
              }
            />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
    </MotionConfig>
  );
}

