import { useState, useEffect } from 'react';
import { PROFILE } from '../constants';
import { User, Shield, Database, Download, Upload, Trash2, ExternalLink, CheckCircle2, Mail, Linkedin, Table2, Loader2, XCircle } from 'lucide-react';
import { initiateOAuth } from '../lib/auth';

export default function Settings() {
  const [connections, setConnections] = useState<{ google: boolean; linkedin: boolean }>({ google: false, linkedin: false });
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json() as { connections: { google: boolean; linkedin: boolean } };
        setConnections(data.connections);
      }
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    }
  };

  const handleConnect = async (provider: 'google' | 'linkedin') => {
    setIsConnecting(provider);
    try {
      await initiateOAuth(provider);
      await fetchConnections();
    } catch (err) {
      console.error(`Failed to connect ${provider}:`, err);
      alert(err instanceof Error ? err.message : `Failed to connect ${provider}`);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnect = async (provider: 'google' | 'linkedin') => {
    if (!confirm(`Disconnect ${provider}? This will stop real-time updates.`)) return;
    
    setIsConnecting(provider);
    try {
      const res = await fetch(`/api/settings/disconnect?provider=${provider}`, { method: 'POST' });
      if (res.ok) {
        await fetchConnections();
      } else {
        const data = await res.json() as { error: string };
        alert(data.error);
      }
    } catch (err) {
      console.error(`Failed to disconnect ${provider}:`, err);
    } finally {
      setIsConnecting(null);
    }
  };
  const exportAllData = () => {
    const data = {
      tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
      apps: JSON.parse(localStorage.getItem('apps') || '[]'),
      fixes: JSON.parse(localStorage.getItem('li-fixes') || '[]'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mimo-command-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllData = () => {
    if (confirm('Clear ALL data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-2xl text-text">Settings & Resources</h1>
        <p className="text-text-3 text-sm">Profile info · API configuration · Free tool stack</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <div className="flex items-center gap-2 text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-2">
            <User size={14} /> Your Profile Info
          </div>
          <div className="space-y-0 divide-y divide-border">
            {[
              ['Full name', PROFILE.name],
              ['Location', PROFILE.location],
              ['Phone', PROFILE.phone],
              ['Email', PROFILE.email],
              ['LinkedIn', PROFILE.linkedin],
              ['Website', PROFILE.website],
              ['Services', PROFILE.services],
              ['Calendly', PROFILE.calendly]
            ].map(([k, v], i) => (
              <div key={i} className="flex justify-between py-3 text-[12.5px]">
                <span className="text-text-3">{k}</span>
                <span className="text-text text-right font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card space-y-4">
            <div className="flex items-center gap-2 text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-2">
              <Shield size={14} /> API Configuration
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-bold text-text-3 uppercase">Gemini API Key</label>
                <div className="relative">
                  <input 
                    type="password" 
                    readOnly 
                    value="************************"
                    className="input pr-10 bg-surface-2" 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 size={16} className="text-green-500" />
                  </div>
                </div>
                <p className="text-[10.5px] text-text-4 mt-1">
                  Injected automatically from AI Studio secrets.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-green">Connected</div>
                <span className="text-[11px] text-text-4">Gemini 1.5 Flash active</span>
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-4">
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">Third-Party Connections</div>
              
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="text-[10px] font-bold text-amber-700 uppercase mb-1">Action Required</div>
                <p className="text-[11px] text-amber-600 leading-tight">
                  Ensure your LinkedIn/Google Developer portals have this Redirect URI:
                  <code className="block mt-1 p-1 bg-white/50 rounded border border-amber-200 break-all">
                    {window.location.origin}/auth/linkedin/callback
                  </code>
                </p>
              </div>

              {/* Google Connection */}
              <div className="flex items-center justify-between p-3 bg-bg border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-text">Google (Gmail & Sheets)</div>
                    <div className="text-[11px] text-text-3">Auto-log to Sheets & Auto-apply via Gmail</div>
                  </div>
                </div>
                <button 
                  onClick={() => connections.google ? handleDisconnect('google') : handleConnect('google')}
                  disabled={isConnecting === 'google'}
                  className={`btn btn-sm ${connections.google ? 'btn-ghost text-red-600 hover:bg-red-50' : 'btn-primary'}`}
                >
                  {isConnecting === 'google' ? <Loader2 size={14} className="animate-spin" /> : 
                   connections.google ? <><XCircle size={14} className="mr-1" /> Disconnect</> : 'Connect'}
                </button>
              </div>

              {/* LinkedIn Connection */}
              <div className="flex items-center justify-between p-3 bg-bg border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Linkedin size={18} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-text">LinkedIn</div>
                    <div className="text-[11px] text-text-3">Profile auditing & Social posting</div>
                  </div>
                </div>
                <button 
                  onClick={() => connections.linkedin ? handleDisconnect('linkedin') : handleConnect('linkedin')}
                  disabled={isConnecting === 'linkedin'}
                  className={`btn btn-sm ${connections.linkedin ? 'btn-ghost text-red-600 hover:bg-red-50' : 'btn-primary'}`}
                >
                  {isConnecting === 'linkedin' ? <Loader2 size={14} className="animate-spin" /> : 
                   connections.linkedin ? <><XCircle size={14} className="mr-1" /> Disconnect</> : 'Connect'}
                </button>
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-3">
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">Data Management</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={exportAllData} className="btn btn-ghost btn-sm gap-2">
                  <Download size={14} /> Export All Data
                </button>
                <button className="btn btn-ghost btn-sm gap-2">
                  <Upload size={14} /> Import Data
                </button>
                <button onClick={clearAllData} className="btn btn-ghost btn-sm gap-2 text-red-500 hover:text-red-400">
                  <Trash2 size={14} /> Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-4">
          <Database size={14} /> Free Tool Stack
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: 'Canva', url: 'https://canva.com', tier: 'Free', desc: 'LinkedIn banners, gig thumbnails' },
            { name: 'Buffer', url: 'https://buffer.com', tier: 'Free', desc: 'Schedule posts to LinkedIn' },
            { name: 'Notion', url: 'https://notion.so', tier: 'Free', desc: 'Job tracker, content calendar' },
            { name: 'Grammarly', url: 'https://grammarly.com', tier: 'Free', desc: 'Catches errors in cover letters' },
            { name: 'Remove.bg', url: 'https://remove.bg', tier: 'Free', desc: 'Remove background from photo' },
            { name: 'Hemingway', url: 'https://hemingwayapp.com', tier: 'Free', desc: 'Aim for Grade 6 readability' },
            { name: 'Google Analytics', url: 'https://analytics.google.com', tier: 'Free', desc: 'Track website traffic' },
            { name: 'Make.com', url: 'https://make.com', tier: 'Free', desc: 'Automation platform' }
          ].map((t, i) => (
            <div key={i} className="p-4 bg-bg border border-border rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <a href={t.url} target="_blank" rel="noopener noreferrer" className="font-bold text-accent text-[13px] hover:underline flex items-center gap-1">
                  {t.name} <ExternalLink size={12} />
                </a>
                <span className="badge badge-green text-[9px]">{t.tier}</span>
              </div>
              <p className="text-[11.5px] text-text-3 leading-snug">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Debug Info */}
      <div className="mt-8 pt-8 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Troubleshooting</h3>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm text-amber-800 font-medium">Redirect URI Helper</p>
              <p className="text-xs text-amber-700">
                Copy this exact URL into your LinkedIn/Google Developer Portal:
              </p>
              <div className="flex items-center gap-2 bg-white/50 p-2 rounded border border-amber-200 font-mono text-[10px] text-amber-900 break-all">
                {window.location.origin}/auth/linkedin/callback
              </div>
              <p className="text-[10px] text-amber-600 italic">
                Note: If your production site is not updating, ensure you have run "wrangler deploy" and initialized your remote D1 database.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
