/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldAlert, LayoutDashboard, Code, History, Github, Settings, Menu, X, Play, Shield, Zap, CheckCircle2, AlertTriangle, Bug, Users, ActivitySquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { AutoLogout } from './components/AutoLogout';
import { CodeAnalyzer } from './components/CodeAnalyzer';
import { Dashboard } from './components/Dashboard';
import { UserProfile } from './components/UserProfile';
import { ScanHistoryView } from './components/ScanHistoryView';
import { TeamManagement } from './components/TeamManagement';
import { ApiUsageDashboard } from './components/ApiUsageDashboard';

type Page = 'dashboard' | 'analyze' | 'history' | 'team' | 'api-usage' | 'settings' | 'profile';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" richColors />
      <AutoLogout />
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="w-64 h-full bg-slate-900 text-white flex flex-col shrink-0 drop-shadow-xl z-20"
          >
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-xl">B</div>
                <span className="text-xl font-semibold tracking-tight truncate">BugHunter AI</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-slate-800 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Core</div>
              <NavItem 
                icon={<LayoutDashboard className="w-5 h-5" />} 
                label="Dashboard" 
                active={currentPage === 'dashboard'} 
                onClick={() => setCurrentPage('dashboard')} 
              />
              <NavItem 
                icon={<Code className="w-5 h-5" />} 
                label="New Analysis" 
                active={currentPage === 'analyze'} 
                onClick={() => setCurrentPage('analyze')} 
              />
              <NavItem 
                icon={<History className="w-5 h-5" />} 
                label="Scan History" 
                active={currentPage === 'history'} 
                onClick={() => setCurrentPage('history')} 
              />
              <div className="px-3 py-2 mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
              <NavItem 
                icon={<Users className="w-5 h-5" />} 
                label="Team Management" 
                active={currentPage === 'team'} 
                onClick={() => setCurrentPage('team')} 
              />
              <NavItem 
                icon={<ActivitySquare className="w-5 h-5" />} 
                label="API Usage" 
                active={currentPage === 'api-usage'} 
                onClick={() => setCurrentPage('api-usage')} 
              />
            </nav>

            <div className="p-4 border-t border-slate-800">
              <div 
                onClick={() => setCurrentPage('profile')}
                className="flex items-center gap-3 mb-4 px-3 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">PH</div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium hover:underline">User Profile</span>
                  <span className="text-[10px] text-slate-500">Developer</span>
                </div>
              </div>
              <NavItem 
                icon={<Settings className="w-5 h-5" />} 
                label="Settings" 
                active={currentPage === 'settings'} 
                onClick={() => setCurrentPage('settings')} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="relative w-full max-w-md hidden md:block">
              <input type="text" placeholder="Search repositories, bugs, or projects..." className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-700" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold hidden md:block">v1.2.0-Stable</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto h-full"
            >
              {currentPage === 'dashboard' && <Dashboard onNavigate={(page) => setCurrentPage(page as Page)} />}
              {currentPage === 'analyze' && <CodeAnalyzer />}
              {currentPage === 'history' && <ScanHistoryView />}
              {currentPage === 'team' && <TeamManagement />}
              {currentPage === 'api-usage' && <ApiUsageDashboard />}
              {currentPage === 'profile' && <UserProfile />}
              {currentPage === 'settings' && (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <p>Settings module coming soon.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium w-full text-left transition-colors ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

