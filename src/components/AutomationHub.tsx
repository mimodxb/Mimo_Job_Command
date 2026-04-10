import { MAKE_SCENARIOS } from '../constants';
import { Copy, Repeat, ExternalLink, Info, Zap, Mail, Database, Clock } from 'lucide-react';

export default function AutomationHub() {
  const gmailFlows = [
    { name: 'Job Application Tracker', icon: Table2, desc: 'When you apply to a job, BCC tracker@gmail.com. A Make.com scenario reads this mailbox and auto-adds rows to your Google Sheet tracker.', setup: 'BCC: your Gmail address → Make.com watches label → adds to Sheets' },
    { name: 'Follow-up Reminder', icon: Clock, desc: 'Make.com checks your Sheets tracker daily. If any "applied" row is 5+ business days old, it drafts a follow-up email in Gmail Drafts.', setup: 'Make: Google Sheets → Check date → If 5+ days → Gmail: Create Draft' },
    { name: 'CV Email Alias', icon: Mail, desc: 'Create a Gmail filter: any email with "CV" or "resume" attachment gets auto-labeled and starred for tracking.', setup: 'Gmail → Settings → Filters → has:attachment filename:CV → Apply label' }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-2xl text-text">Automation Hub</h1>
        <p className="text-text-3 text-sm">Make.com flows · Gmail integrations · Trigger-based workflows you can activate today</p>
      </header>

      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 items-center">
        <Info size={18} className="text-blue-500 flex-shrink-0" />
        <p className="text-[13px] text-blue-200/80 leading-relaxed">
          <strong>Your setup:</strong> Make.com + Gmail + Google Drive + Claude API all available. These automations use your existing subscriptions — no extra cost.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">Make.com Automation Scenarios</div>
          <div className="space-y-3">
            {MAKE_SCENARIOS.map((s, i) => (
              <div key={i} className="card space-y-4 bg-bg border-border hover:border-border-2 transition-all">
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
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">How to Activate</div>
            <div className="space-y-6">
              {[
                { title: 'Open Make.com', desc: 'Go to make.com and log in to your account' },
                { title: 'Create New Scenario', desc: 'Click "+ Create a new scenario" and use the template or build from scratch' },
                { title: 'Use Claude to Build It', desc: 'In a new Claude chat say: "Build me the [scenario name] Make.com automation using my connected Make MCP"' },
                { title: 'Test & Activate', desc: 'Run once manually to confirm it works, then turn on scheduling' }
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
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">Gmail Integration Flows</div>
            <div className="space-y-3">
              {gmailFlows.map((f, i) => (
                <div key={i} className="card flex gap-4 p-4 bg-bg border-border">
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

import { Table2 } from 'lucide-react';
