import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { AppProvider } from './context/AppContext';
import { CoordinatorDeskPage } from './pages/CoordinatorDeskPage';
import { ReportHelpPage } from './pages/ReportHelpPage';
import { ResourcesGuidesPage } from './pages/ResourcesGuidesPage';
import { SituationBoardPage } from './pages/SituationBoardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<SituationBoardPage />} />
            <Route path="/report" element={<ReportHelpPage />} />
            <Route path="/resources" element={<ResourcesGuidesPage />} />
            <Route path="/coordinator" element={<CoordinatorDeskPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AppProvider>
    </BrowserRouter>
  );
}
