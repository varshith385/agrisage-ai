import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Footer } from '../common/Footer';
import { VoiceAssistant } from '../voice/VoiceAssistant';
import { ActiveFarmBanner } from '../common/ActiveFarmBanner';
import { GuidedTour } from '../guidance/GuidedTour';
import { useAuth } from '../../context/AuthContext';

export const Layout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [tourOpen, setTourOpen] = useState(false);

  // Auto-launch tour once for first-time visitors if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const completed = localStorage.getItem('agrisage_tour_completed_v1');
        if (!completed) {
          // Delay by 1.2s for smooth initial render
          const timer = setTimeout(() => setTourOpen(true), 1200);
          return () => clearTimeout(timer);
        }
      } catch {
        // ignore
      }
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex bg-[#FFFDF8] dark:bg-[#0D1410] text-[#1F2A24] dark:text-[#F2F5F3] transition-colors duration-200">
      {/* Collapsible Desktop Left Sidebar with 72px rail / 248px expanded */}
      {isAuthenticated && <Sidebar onStartTour={() => setTourOpen(true)} />}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onStartTour={() => setTourOpen(true)} />

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-8 py-5 pb-28 md:pb-12">
          <ActiveFarmBanner />
          <Outlet />
        </main>

        <Footer />
      </div>

      {/* Mobile Bottom Navigation Bar (< 768px) with 4 main pages + "More" sheet */}
      <BottomNav onStartTour={() => setTourOpen(true)} />

      {/* Interactive Guided Tour Overlay */}
      <GuidedTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />

      {/* Global Floating Voice Assistant Container on EVERY page */}
      <div
        id="global-voice-assistant-slot"
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-30"
      >
        <VoiceAssistant />
      </div>
    </div>
  );
};

export default Layout;
