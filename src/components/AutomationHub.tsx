/**
 * AutomationHub.tsx — FIXED
 *
 * Bug fixed: The original file imported { Table2, Clock } from 'lucide-react'
 * at the BOTTOM of the file, after the component declaration and export.
 * This causes a ReferenceError at runtime in strict mode because the
 * component body references Table2 and Clock before they are declared.
 *
 * Fix: All imports are moved to the top of the file as required.
 */

import { useState, useEffect } from 'react';
import { Copy, ExternalLink, Info, Clock, Table2, Bot, Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { MAKE_SCENARIOS } from '../constants';

interface AutomationLog {
  id: number;
  job_id: string;
  title: string;
  url: string;
  score: number;
  bucket: string;
  reason: string;
  apply_status: string;
  created_at: string;
}

export default function AutomationHub() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connections, setConnections] = useState<{ google: boolean; linkedin: boolean }>({ google: false, linkedin: false });

  useEffect(() => {
    fetchLogs();
    fetchConnections();
    const interval = setInterval(fetchLogs, 30000); // Refresh every 30s
    return () => clearInterval(interval);
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

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/automation/logs');
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching logs');
    } finally {
      setIsLoading(false);
    }
  };
  const gmailFlows = [
    {
      name: 'Job Application Tracker',
      icon: Table2,
      desc: 'When you apply to a job, BCC tracker@gmail.com. A Make.com scenario reads this mailbox and auto-adds rows to your Google Sheet tracker.',
      setup: 'BCC: your Gmail address → Make.com watches label → adds to Sheets',
    },
    {
      name: 'Follow-up Reminder',
      icon: Clock,
      desc: "Make.com checks your Sheets tracker daily. If any 'applied' row is 5+ business days old, it drafts a follow-up email in Gmail Drafts.",
      setup: 'Make: Google Sheets → Check date → If 5+ days → Gmail: Create Draft',
    },
    {
      name: 'CV Email Alias',
      icon: Table2,
      desc: 'Create a Gmail filter: any email with "CV" or "resume" attachment gets auto-labeled and starred for tracking.',
      setup: 'Gmail → Settings → Filters → has:attachment filename:CV → Apply label',
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-2xl text-text">Automation Hub</h1>
        <p className="text-text-3 text-sm">
          Make.com flows · Gmail integrations · Trigger-based workflows you can activate today
        </p>
      </header>

      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 items-center">
        <Info size={18} className="text-blue-500 flex-shrink-0" />
        <p className="text-[13px] text-blue-700/80 leading-relaxed">
          <strong>Autonomous Mode:</strong> The Job Hunter is now running directly on Cloudflare Edge. 
          It scans RSS feeds every hour, scores jobs with Gemini, and notifies you via Telegram.
        </p>
      </div>

      {/* Autonomous Bot Status */}
      <div className="card border-accent/20 bg-accent/5 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="font-bold text-text text-lg">Autonomous Job Hunter</h2>
              <div className="flex items-center gap-2 text-[11px] font-bold text-accent uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Active on Cloudflare Edge
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchLogs} className="btn btn-ghost btn-sm gap-2">
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Refresh Logs
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-3">
              <Loader2 size={32} className="animate-spin mb-4" />
              <p className="text-sm font-medium">Connecting to D1 Database...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-red-50 border border-red-100 rounded-xl">
              <p className="text-sm text-red-600 font-bold mb-1">Database Connection Error</p>
              <p className="text-xs text-red-500">{error}</p>
              <p className="text-[10px] text-red-400 mt-4 uppercase font-bold">Ensure D1 Binding 'DB' is configured in Cloudflare</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-border rounded-xl opacity-50">
              <p className="text-sm font-medium text-text-3">No logs found. The bot will start scanning on the next hour.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-text-4 uppercase tracking-wider border-b border-border">
                    <th className="pb-3 pl-2">Job Title</th>
                    <th className="pb-3 text-center">Score</th>
                    <th className="pb-3">Bucket</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="group hover:bg-white/50 transition-colors">
                      <td className="py-4 pl-2">
                        <div className="font-bold text-[13px] text-text group-hover:text-accent transition-colors truncate max-w-[250px]">
                          {log.title}
                        </div>
                        <div className="text-[11px] text-text-3 mt-0.5 flex items-center gap-2">
                          {log.reason}
                          <a href={log.url} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1">
                            Link <ExternalLink size={10} />
                          </a>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-[11px] ${
                          log.score >= 80 ? 'bg-green-100 text-green-700' :
                          log.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {log.score}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`badge ${
                          log.bucket === 'PRIMARY' ? 'badge-blue' : 'badge-gray'
                        } text-[10px]`}>
                          {log.bucket}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          {log.apply_status === 'PENDING' ? (
                            <><Clock size={12} className="text-amber-500" /> <span className="text-amber-600">Pending</span></>
                          ) : log.apply_status === 'SKIPPED' ? (
                            <><XCircle size={12} className="text-slate-400" /> <span className="text-slate-500">Skipped</span></>
                          ) : (
                            <><CheckCircle2 size={12} className="text-green-500" /> <span className="text-green-600">Applied</span></>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-2 text-right text-[11px] text-text-4 font-mono">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">
            Make.com Automation Scenarios
          </div>
          <div className="space-y-3">
            {MAKE_SCENARIOS.map((s, i) => (
              <div
                key={i}
                className="card space-y-4 bg-bg border-border hover:border-border-2 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-text text-[14px] mb-1">{s.name}</div>
                    <div className="text-[12px] text-text-3 leading-relaxed">{s.desc}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="badge badge-gray">{s.ops} ops/run</span>
                    <span className="badge badge-green">{s.status}</span>
                  </div>
                </div>
                <div className="bg-surface p-3 rounded-lg text-[11.5px] text-text-4 font-mono leading-relaxed border border-border">
                  {s.prompt}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(s.prompt)}
                  className="btn btn-ghost btn-sm w-full gap-2"
                >
                  <Copy size={14} /> Copy Prompt for Claude
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card space-y-6">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">
              How to Activate
            </div>
            <div className="space-y-6">
              {[
                { title: 'Open Make.com', desc: 'Go to make.com and log in to your account' },
                {
                  title: 'Create New Scenario',
                  desc: 'Click "+ Create a new scenario" and use the template or build from scratch',
                },
                {
                  title: 'Use Claude to Build It',
                  desc: 'In a new Claude chat say: "Build me the [scenario name] Make.com automation using my connected Make MCP"',
                },
                {
                  title: 'Test & Activate',
                  desc: 'Run once manually to confirm it works, then turn on scheduling',
                },
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] text-text mb-1">{step.title}</div>
                    <div className="text-[11.5px] text-text-3 leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => window.open('https://make.com', '_blank')}
              className="btn btn-primary w-full py-2.5 gap-2"
            >
              Open Make.com <ExternalLink size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">
              Gmail Integration Flows
            </div>
            <div className="space-y-3">
              {gmailFlows.map((f, i) => (
                <div
                  key={i}
                  className="card flex gap-4 p-4 bg-bg border-border relative overflow-hidden"
                >
                  {!connections.google && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-border flex flex-col items-center gap-2">
                        <XCircle size={20} className="text-red-500" />
                        <span className="text-[11px] font-bold text-text uppercase tracking-wider">Google Not Connected</span>
                      </div>
                    </div>
                  )}
                  <div className="w-10 h-10 bg-surface-2 rounded-lg flex items-center justify-center text-accent flex-shrink-0">
                    <f.icon size={20} />
                  </div>
                  <div className="space-y-2">
                    <div className="font-semibold text-text text-[13.5px]">{f.name}</div>
                    <p className="text-[12px] text-text-3 leading-relaxed">{f.desc}</p>
                    <div className="bg-surface p-2 rounded-md text-[11px] text-text-4 font-mono leading-tight border border-border">
                      {f.setup}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
