import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Layout } from './components/layout/Layout';
import { AuthPage } from './pages/AuthPage';
import { LocationWeatherPage } from './pages/LocationWeatherPage';
import { FarmRegistrationPage } from './pages/FarmRegistrationPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiseasePage } from './pages/DiseasePage';
import { IrrigationPage } from './pages/IrrigationPage';
import { EconomicsPage } from './pages/EconomicsPage';
import { MarketPage } from './pages/MarketPage';
import { CalendarPage } from './pages/CalendarPage';
import { CropRecommendationPage } from './pages/CropRecommendationPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<AuthPage />} />
                <Route path="login" element={<AuthPage />} />
                <Route path="register" element={<AuthPage />} />
                <Route path="setup" element={<LocationWeatherPage />} />
                <Route path="farms" element={<FarmRegistrationPage />} />
                <Route path="disease" element={<DiseasePage />} />
                <Route path="irrigation" element={<IrrigationPage />} />
                <Route path="economics" element={<EconomicsPage />} />
                <Route path="market" element={<MarketPage />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="recommend" element={<CropRecommendationPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;

