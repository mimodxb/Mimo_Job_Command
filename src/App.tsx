/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Linkedin, 
  Sparkles, 
  Briefcase, 
  Table2, 
  Mail, 
  Gem, 
  Repeat, 
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Application } from './types';
import { INITIAL_TASKS, PROFILE } from './constants';

// Sub-components (to be implemented)
import Dashboard from './components/Dashboard';
import LinkedInEngine from './components/LinkedInEngine';
import ContentAI from './components/ContentAI';
import JobHunt from './components/JobHunt';
import AppTracker from './components/AppTracker';
import OutreachHub from './components/OutreachHub';
import GigCenter from './components/GigCenter';
import AutomationHub from './components/AutomationHub';
import Settings from './components/Settings';
import MimoAssistant from './components/MimoAssistant';

type Page = 'dashboard' | 'linkedin' | 'content' | 'jobs' | 'tracker' | 'email' | 'gigs' | 'automation' | 'settings';

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [apps, setApps] = useState<Application[]>(() => {
    const saved = localStorage.getItem('apps');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('apps', JSON.stringify(apps));
  }, [apps]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'CORE' },
    { id: 'linkedin', label: 'LinkedIn Engine', icon: Linkedin, section: 'CORE' },
    { id: 'content', label: 'Content AI', icon: Sparkles, section: 'CORE' },
    { id: 'jobs', label: 'Job Hunt', icon: CircleDot, section: 'APPLICATIONS' },
    { id: 'tracker', label: 'App Tracker', icon: Table2, section: 'APPLICATIONS' },
    { id: 'email', label: 'Outreach Hub', icon: Mail, section: 'APPLICATIONS' },
    { id: 'gigs', label: 'Gig Center', icon: Gem, section: 'FREELANCE' },
    { id: 'automation', label: 'Automation', icon: Repeat, section: 'FREELANCE' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, section: 'SYSTEM' },
  ];

  const sections = ['CORE', 'APPLICATIONS', 'FREELANCE', 'SYSTEM'];

  return (
    <div className="flex h-screen bg-bg text-text overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`bg-surface border-r border-border flex flex-col transition-all duration-300 z-10 ${
          isSidebarCollapsed ? 'w-[60px]' : 'w-[240px]'
        }`}
      >
        <div className="p-4 border-b border-border flex items-center gap-3 min-h-[60px] bg-white">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-2 rounded-lg flex-shrink-0 flex items-center justify-center font-display font-extrabold text-white shadow-md shadow-accent/20">
            M
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="font-display font-bold text-[14px] text-text">Mimo Command</div>
              <div className="text-[10px] text-text-3 font-semibold">Career Control Center</div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white">
          {sections.map(section => (
            <div key={section} className="mb-4">
              {!isSidebarCollapsed && (
                <div className="px-3 py-2 text-[10px] font-bold tracking-widest text-text-4 uppercase">
                  {section}
                </div>
              )}
              {navItems.filter(item => item.section === section).map(item => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id as Page)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all mb-0.5 group ${
                    activePage === item.id 
                      ? 'bg-accent/5 text-accent border-l-4 border-accent shadow-sm' 
                      : 'text-text-3 hover:bg-surface-2 hover:text-text border-l-4 border-transparent'
                  }`}
                >
                  <item.icon size={18} className={`flex-shrink-0 ${activePage === item.id ? 'text-accent' : 'text-text-3 group-hover:text-text'}`} />
                  {!isSidebarCollapsed && (
                    <span className="text-[12.5px] font-bold truncate">{item.label}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-border">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 border border-border-2 rounded-md text-text-3 hover:bg-surface-2 hover:text-text-2 transition-all"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <div className="flex items-center gap-2 text-[11px]"><ChevronLeft size={16} /> collapse</div>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activePage === 'dashboard' && <Dashboard tasks={tasks} setTasks={setTasks} apps={apps} setActivePage={setActivePage} />}
              {activePage === 'linkedin' && <LinkedInEngine />}
              {activePage === 'content' && <ContentAI />}
              {activePage === 'jobs' && <JobHunt />}
              {activePage === 'tracker' && <AppTracker apps={apps} setApps={setApps} />}
              {activePage === 'email' && <OutreachHub />}
              {activePage === 'gigs' && <GigCenter />}
              {activePage === 'automation' && <AutomationHub />}
              {activePage === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <MimoAssistant />
    </div>
  );
}

