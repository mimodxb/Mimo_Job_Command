import { useState, useMemo, Dispatch, SetStateAction } from 'react';
import { Application } from '../types';
import { Plus, Search, Filter, Download, Trash2, ExternalLink, MoreVertical } from 'lucide-react';

interface AppTrackerProps {
  apps: Application[];
  setApps: Dispatch<SetStateAction<Application[]>>;
}

export default function AppTracker({ apps, setApps }: AppTrackerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New App Form State
  const [newApp, setNewApp] = useState<Partial<Application>>({
    company: '',
    role: '',
    source: 'LinkedIn',
    status: 'applied',
    notes: '',
    url: '',
    email: ''
  });

  const filteredApps = useMemo(() => {
    return apps.filter(a => {
      const matchesSearch = !search || (a.company + a.role + a.notes).toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [apps, search, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    return {
      total: apps.length,
      interview: apps.filter(a => a.status === 'interview').length,
      pending: apps.filter(a => a.status === 'pending').length,
      followup: apps.filter(a => {
        const diff = Math.floor((today.getTime() - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 5 && a.status === 'applied' && !a.followup;
      }).length
    };
  }, [apps]);

  const handleAddApp = () => {
    if (!newApp.company || !newApp.role) return;
    const app: Application = {
      id: Date.now(),
      company: newApp.company!,
      role: newApp.role!,
      source: newApp.source || 'LinkedIn',
      status: (newApp.status as any) || 'applied',
      date: new Date().toISOString().split('T')[0],
      followup: '',
      email: newApp.email || '',
      url: newApp.url || '',
      notes: newApp.notes || ''
    };
    setApps(prev => [app, ...prev]);
    setIsModalOpen(false);
    setNewApp({ company: '', role: '', source: 'LinkedIn', status: 'applied', notes: '', url: '', email: '' });
  };

  const deleteApp = (id: number) => {
    if (confirm('Delete this application?')) {
      setApps(prev => prev.filter(a => a.id !== id));
    }
  };

  const cycleStatus = (id: number) => {
    const statuses: Application['status'][] = ['applied', 'pending', 'interview', 'rejected', 'offer'];
    setApps(prev => prev.map(a => {
      if (a.id === id) {
        const nextIndex = (statuses.indexOf(a.status) + 1) % statuses.length;
        return { ...a, status: statuses[nextIndex] };
      }
      return a;
    }));
  };

  const exportCSV = () => {
    const headers = ['Company', 'Role', 'Source', 'Status', 'Date Applied', 'Follow-up', 'Notes', 'URL'];
    const rows = apps.map(a => [a.company, a.role, a.source, a.status, a.date, a.followup || '', a.notes || '', a.url || ''].map(v => `"${v}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job-applications.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-text">Application Tracker</h1>
          <p className="text-text-3 text-sm">Track every application · Auto-saves to browser · Follow-up reminders</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary gap-2">
          <Plus size={18} /> Add Application
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applied', value: stats.total, color: 'text-text' },
          { label: 'Interviews', value: stats.interview, color: 'text-emerald-600' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
          { label: 'Follow-up Due', value: stats.followup, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-border rounded-xl p-5 text-center shadow-sm">
            <div className="text-[10.5px] text-text-3 font-bold uppercase tracking-wider mb-1.5">{s.label}</div>
            <div className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card space-y-5 shadow-md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-4" />
            <input 
              type="text" 
              placeholder="Search applications..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 h-11 font-medium" 
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-[150px] h-11 font-bold"
            >
              <option value="">All Status</option>
              <option value="applied">Applied</option>
              <option value="pending">Pending</option>
              <option value="interview">Interview</option>
              <option value="rejected">Rejected</option>
              <option value="offer">Offer</option>
            </select>
            <button onClick={exportCSV} className="btn btn-ghost h-11 gap-2 font-bold">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-[10.5px] font-bold text-text-3 uppercase tracking-wider">Company</th>
                <th className="px-4 py-3 text-[10.5px] font-bold text-text-3 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-[10.5px] font-bold text-text-3 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-[10.5px] font-bold text-text-3 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10.5px] font-bold text-text-3 uppercase tracking-wider">Applied</th>
                <th className="px-4 py-3 text-[10.5px] font-bold text-text-3 uppercase tracking-wider">Follow-up</th>
                <th className="px-4 py-3 text-[10.5px] font-bold text-text-3 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredApps.map(app => {
                const diff = Math.floor((new Date().getTime() - new Date(app.date).getTime()) / (1000 * 60 * 60 * 24));
                const needsFollowup = diff >= 5 && app.status === 'applied' && !app.followup;
                
                const statusColors = {
                  applied: 'badge-blue',
                  pending: 'badge-yellow',
                  interview: 'badge-green',
                  rejected: 'badge-red',
                  offer: 'badge-purple'
                };

                return (
                  <tr key={app.id} className="hover:bg-surface-2 transition-colors group">
                    <td className="px-4 py-4 font-medium text-text">{app.company}</td>
                    <td className="px-4 py-4 text-text-2">{app.role}</td>
                    <td className="px-4 py-4">
                      <span className="badge badge-gray border border-border">{app.source}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button 
                        onClick={() => cycleStatus(app.id)}
                        className={`badge ${statusColors[app.status]} cursor-pointer hover:opacity-80`}
                      >
                        {app.status}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-[11.5px] font-mono text-text-3">{app.date}</td>
                    <td className="px-4 py-4">
                      <span className={`badge ${needsFollowup ? 'badge-red' : 'badge-gray'}`}>
                        {needsFollowup ? 'DUE' : diff < 5 ? `${diff}d` : 'sent'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {app.url && (
                          <button onClick={() => window.open(app.url, '_blank')} className="p-1.5 text-text-3 hover:text-accent transition-colors">
                            <ExternalLink size={14} />
                          </button>
                        )}
                        <button onClick={() => deleteApp(app.id)} className="p-1.5 text-text-3 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-4 italic">
                    No applications found. Add your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="text-[11.5px] text-text-3 pt-2">
          Data saved in browser localStorage. Export CSV to backup. Goal: 5 applications/day, follow up after 5 business days.
        </div>
      </div>

      {/* Add App Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
          <div className="bg-surface border border-border-2 rounded-xl p-6 w-full max-w-[560px] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display font-bold text-lg">Add Application</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-3 hover:text-text">✕</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-text-3 uppercase">Company *</label>
                <input 
                  type="text" 
                  value={newApp.company}
                  onChange={(e) => setNewApp({ ...newApp, company: e.target.value })}
                  className="input" 
                  placeholder="Company name" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-text-3 uppercase">Role *</label>
                <input 
                  type="text" 
                  value={newApp.role}
                  onChange={(e) => setNewApp({ ...newApp, role: e.target.value })}
                  className="input" 
                  placeholder="Job title" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-text-3 uppercase">Source</label>
                <select 
                  value={newApp.source}
                  onChange={(e) => setNewApp({ ...newApp, source: e.target.value })}
                  className="input"
                >
                  <option>LinkedIn</option>
                  <option>Bayt.com</option>
                  <option>Indeed UAE</option>
                  <option>Naukrigulf</option>
                  <option>GulfTalent</option>
                  <option>Dubizzle</option>
                  <option>Direct</option>
                  <option>Referral</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-text-3 uppercase">Status</label>
                <select 
                  value={newApp.status}
                  onChange={(e) => setNewApp({ ...newApp, status: e.target.value as any })}
                  className="input"
                >
                  <option value="applied">Applied</option>
                  <option value="pending">Pending</option>
                  <option value="interview">Interview</option>
                  <option value="rejected">Rejected</option>
                  <option value="offer">Offer</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-text-3 uppercase">Job URL</label>
                <input 
                  type="url" 
                  value={newApp.url}
                  onChange={(e) => setNewApp({ ...newApp, url: e.target.value })}
                  className="input" 
                  placeholder="https://..." 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-text-3 uppercase">Their email</label>
                <input 
                  type="email" 
                  value={newApp.email}
                  onChange={(e) => setNewApp({ ...newApp, email: e.target.value })}
                  className="input" 
                  placeholder="hr@company.com" 
                />
              </div>
            </div>

            <div className="space-y-1.5 mb-6">
              <label className="text-[10.5px] font-bold text-text-3 uppercase">Notes</label>
              <textarea 
                value={newApp.notes}
                onChange={(e) => setNewApp({ ...newApp, notes: e.target.value })}
                className="input min-h-[80px] resize-none" 
                placeholder="Referred via contact, salary range, etc." 
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
              <button 
                onClick={handleAddApp}
                disabled={!newApp.company || !newApp.role}
                className="btn btn-primary px-6"
              >
                Add Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
