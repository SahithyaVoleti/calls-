import React from 'react';
import { Navbar } from './Navbar';
import { IncomingCallDialog } from '../call/IncomingCallDialog';
import { CallOverlay } from '../call/CallOverlay';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col selection:bg-violet-500/30">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Global Call Modals and Overlays */}
      <IncomingCallDialog />
      <CallOverlay />
    </div>
  );
};
