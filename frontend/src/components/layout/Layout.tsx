import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { VoiceAssistant } from '../voice/VoiceAssistant';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-agri-cream-50 text-stone-900">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
        <Outlet />
      </main>
      <BottomNav />

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

