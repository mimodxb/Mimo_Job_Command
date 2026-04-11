import { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { Task, Application } from '../types';
import { INITIAL_TASKS } from '../constants';
import { ExternalLink, CheckCircle2, Circle, TrendingUp, Users, Briefcase, Mail, Loader2, AlertCircle } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  apps: Application[];
  setActivePage: (page: any) => void;
}

export default function Dashboard({ tasks, setTasks, apps, setActivePage }: DashboardProps) {
  const [liStats, setLiStats] = useState<{ followers: number; impressions: number } | null>(null);
  const [isLoadingLi, setIsLoadingLi] = useState(true);
  const [liError, setLiError] = useState<string | null>(null);

  useEffect(() => {
    fetchLinkedInStats();
  }, []);

  const fetchLinkedInStats = async () => {
    try {
      const res = await fetch('/api/linkedin/profile');
      if (res.ok) {
        const data = await res.json() as { followers: number; impressions: number };
        setLiStats({ followers: data.followers, impressions: data.impressions });
      } else if (res.status === 401) {
        setLiError('LinkedIn not connected');
      } else {
        setLiError('Failed to fetch stats');
      }
    } catch (err) {
      setLiError('Network error');
    } finally {
      setIsLoadingLi(false);
    }
  };

  const today = new Date().toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const resetTasks = () => {
    setTasks(INITIAL_TASKS.map(t => ({ ...t })));
  };

  const stats = [
    { 
      label: 'LinkedIn Followers', 
      value: isLoadingLi ? '...' : liStats ? liStats.followers.toLocaleString() : 'N/A', 
      sub: liError === 'LinkedIn not connected' ? 'Connect in Settings' : 'Target: 3,200', 
      color: 'text-yellow-500', 
      progress: liStats ? Math.min(100, (liStats.followers / 3200) * 100) : 0, 
      icon: Users,
      loading: isLoadingLi,
      error: liError
    },
    { 
      label: 'Impressions / yr', 
      value: isLoadingLi ? '...' : liStats ? liStats.impressions.toLocaleString() : 'N/A', 
      sub: '+2,575% growth', 
      color: 'text-green-500', 
      progress: 15, 
      icon: TrendingUp,
      loading: isLoadingLi
    },
    { 
      label: 'Applications Sent', 
      value: apps.length.toString(), 
      sub: 'Target: 5/day', 
      color: 'text-accent', 
      progress: Math.min(100, (apps.length / 5) * 100), 
      icon: Briefcase 
    },
    { 
      label: 'Active Jobs Found', 
      value: 'Live', 
      sub: 'Scanning hourly', 
      color: 'text-accent-2', 
      progress: 100, 
      icon: Mail 
    },
  ];

  const quickLinks = [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/movsummirzazada', icon: '◈' },
    { label: 'Fiverr', url: 'https://www.fiverr.com/users/movsummirzazada', icon: '◆' },
    { label: 'Upwork', url: 'https://www.upwork.com', icon: '◇' },
    { label: 'Gmail', url: 'https://mail.google.com', icon: '◎' },
    { label: 'Bayt.com', url: 'https://www.bayt.com/en/uae/jobs', icon: '◉' },
    { label: 'Indeed UAE', url: 'https://ae.indeed.com/jobs', icon: '◉' },
  ];

  const milestones = [
    { label: 'Followers', now: liStats?.followers || 0, target: 3200, pct: liStats ? Math.min(100, (liStats.followers / 3200) * 100) : 0 },
    { label: 'Weekly impressions', now: liStats?.impressions || 0, target: 1000, pct: 15 },
    { label: 'Search appearances', now: 5, target: 40, pct: 12 },
    { label: 'Posts published', now: 3, target: 40, pct: 7 }
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-text">Welcome back, Movsum.</h1>
          <p className="text-text-3 text-sm">Career Command Center · Dubai, UAE · {today}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-green">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
            Live
          </span>
          <button onClick={() => setActivePage('settings')} className="btn btn-ghost btn-sm">Settings</button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-border rounded-[12px] p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="text-[10.5px] text-text-3 font-bold uppercase tracking-wider mb-1.5">{stat.label}</div>
            <div className="flex items-baseline gap-2">
              <div className={`font-display text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              {stat.loading && <Loader2 size={16} className="animate-spin text-text-4" />}
            </div>
            <div className="text-[11.5px] text-text-2 font-medium mt-1 flex items-center gap-1">
              {stat.error && <AlertCircle size={12} className="text-red-500" />}
              {stat.sub}
            </div>
            <div className="h-2 bg-slate-100 rounded-full mt-4 overflow-hidden border border-slate-200/50">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${stat.color.replace('text-', 'bg-')}`} 
                style={{ width: `${stat.progress}%` }} 
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card border-l-4 border-l-red-500">
          <div className="text-[11px] font-bold tracking-wider text-red-600 uppercase mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Today's Priority Tasks
          </div>
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => toggleTask(task.id)}
                className={`flex items-start gap-3 p-3 bg-slate-50/50 border border-slate-200 rounded-xl cursor-pointer transition-all hover:bg-white hover:border-accent hover:shadow-sm ${task.done ? 'opacity-60 bg-slate-100' : ''}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 shadow-sm ${
                  task.priority === 'red' ? 'bg-red-500' : task.priority === 'yellow' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <span className={`flex-1 text-[13px] text-text font-medium leading-tight ${task.done ? 'line-through text-text-3' : ''}`}>
                  {task.text}
                </span>
                {task.done ? <CheckCircle2 size={18} className="text-accent" /> : <Circle size={18} className="text-slate-300" />}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={resetTasks} className="btn btn-ghost btn-sm font-bold">Reset</button>
            <button onClick={() => setActivePage('tracker')} className="btn btn-ghost btn-sm font-bold text-accent">View Tracker →</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-3">Quick Access</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickLinks.map((link, i) => (
                <a 
                  key={i} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-bg border border-border rounded-lg text-text-2 text-[12px] hover:border-accent hover:text-text transition-all"
                >
                  <span className="text-accent">{link.icon}</span>
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-3">90-Day Milestones</div>
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[12px] text-text-3 mb-1">
                    <span>{m.label}</span>
                    <span className="text-text-4">{m.now} / {m.target}</span>
                  </div>
                  <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        m.pct < 20 ? 'bg-red-500' : m.pct < 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} 
                      style={{ width: `${m.pct}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-4">Jump to Module</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { id: 'linkedin', label: 'LinkedIn Engine', sub: 'Schedule + profile fixes', icon: '◈' },
            { id: 'jobs', label: 'Job Hunt', sub: 'UAE boards + cover letters', icon: '◉' },
            { id: 'content', label: 'Content AI', sub: 'Generate LinkedIn posts', icon: '✦' },
            { id: 'gigs', label: 'Gig Center', sub: 'Fiverr / Upwork copy', icon: '◆' },
            { id: 'automation', label: 'Automation', sub: 'Make.com + Gmail flows', icon: '⟳' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as any)}
              className="flex items-center gap-3 p-3 bg-surface-2 border border-border-2 rounded-lg text-left hover:border-accent hover:bg-surface transition-all group"
            >
              <span className="text-xl text-text-3 group-hover:text-accent">{item.icon}</span>
              <div>
                <div className="font-medium text-[12.5px] text-text">{item.label}</div>
                <div className="text-[11px] text-text-3">{item.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
