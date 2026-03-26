import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import OverviewPage from './pages/Overview';
import EmailList from './pages/EmailList';
import SettingsPage from './pages/Settings';
import ConnectEmail from './pages/ConnectEmail';
import PersonalPage from './pages/Personal';
import PlansPage from './pages/Plans';
import PaymentPage from './pages/Payment';
import ArchitecturePage from './pages/Architecture';
import WorkflowPage from './pages/Workflow';
import HRTracker from './pages/HRTracker';
import BusinessAnalytics from './pages/BusinessAnalytics';
import AlertsCenter from './pages/AlertsCenter';
import { useEmailStore } from './store/useEmailStore';

function App() {
  const initStore = useEmailStore((state) => state.initStore);
  const preferences = useEmailStore((state) => state.preferences);
  const subscriptionType = useEmailStore((state) => state.subscriptionType);
  const accessToken = useEmailStore((state) => state.accessToken);

  useEffect(() => {
    initStore();
  }, [initStore]);

  useEffect(() => {
    // Apply Theme
    const root = window.document.documentElement;
    if (preferences.theme === 'dark' || (preferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply Accent Color
    root.style.setProperty('--primary-500', preferences.accentColor);
    root.style.setProperty('--primary-50', `${preferences.accentColor}10`); 
    
    // Convert hex to RGB for shadows
    const r = parseInt(preferences.accentColor.slice(1, 3), 16);
    const g = parseInt(preferences.accentColor.slice(3, 5), 16);
    const b = parseInt(preferences.accentColor.slice(5, 7), 16);
    root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);

    // Apply Glass Depth (Opacity)
    const opacity = preferences.glassDepth / 100;
    const bgRgb = preferences.theme === 'dark' ? '15, 23, 42' : '255, 255, 255';
    root.style.setProperty('--card-bg', `rgba(${bgRgb}, ${opacity})`);

    // Apply Compact Mode
    if (preferences.isCompact) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  }, [preferences.theme, preferences.accentColor, preferences.glassDepth, preferences.isCompact]);

  const RestrictedRoute = ({ children, minTier }) => {
    const isBasic = subscriptionType === 'Basic';
    const isPro = subscriptionType === 'Pro';
    
    if (isBasic) {
      return <Navigate to="/plans" replace />;
    }
    
    if (minTier === 'Elite' && isPro) {
      return <Navigate to="/plans" replace />;
    }
    
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConnectEmail />} />
        <Route path="/payment" element={<PaymentPage />} />
        
        <Route element={<MainLayout />}>
          <Route path="/personal" element={<PersonalPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="business-analytics" element={<RestrictedRoute minTier="Pro"><BusinessAnalytics /></RestrictedRoute>} />
          <Route path="alerts-center" element={<RestrictedRoute minTier="Elite"><AlertsCenter /></RestrictedRoute>} />
          <Route path="dashboard" element={<RestrictedRoute minTier="Pro"><Dashboard /></RestrictedRoute>} />
          <Route path="hr-tracker" element={<RestrictedRoute minTier="Elite"><HRTracker /></RestrictedRoute>} />
          <Route path="inbox" element={<EmailList title="Incoming Mail" type="inbox" />} />
          <Route path="sent" element={<EmailList title="Outgoing Mail" type="sent" />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="architecture" element={<ArchitecturePage />} />
          <Route path="workflow" element={<WorkflowPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
