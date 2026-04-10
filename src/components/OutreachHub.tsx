import { useState } from 'react';
import { EMAIL_TEMPLATES } from '../constants';
import { Copy, Mail, Linkedin, Send, Clock, Info, AlertTriangle, ExternalLink } from 'lucide-react';

export default function OutreachHub() {
  const [activeTab, setActiveTab] = useState<'email' | 'linkedin-msg' | 'sequences'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof EMAIL_TEMPLATES>('hiring_manager');
  const [emName, setEmName] = useState('');
  const [emCompany, setEmCompany] = useState('');
  const [emDetail, setEmDetail] = useState('');
  const [emEmail, setEmEmail] = useState('');

  const generateEmail = () => {
    let body = EMAIL_TEMPLATES[selectedTemplate].body;
    body = body.replace(/\[Name\]/g, emName || '[Name]');
    body = body.replace(/\[Company\]/g, emCompany || '[Company]');
    body = body.replace(/\[specific detail\]/g, emDetail || '[specific detail]');
    body = body.replace(/\[specific reason\]/g, emDetail || '[specific reason]');
    return body;
  };

  const generateSubject = () => {
    let subject = EMAIL_TEMPLATES[selectedTemplate].subject;
    subject = subject.replace(/\[Name\]/g, emName || '[Name]');
    subject = subject.replace(/\[Company\]/g, emCompany || '[Company]');
    return subject;
  };

  const openGmail = () => {
    const subject = generateSubject();
    const body = generateEmail();
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-2xl text-text">Outreach Hub</h1>
        <p className="text-text-3 text-sm">Email templates · Gmail deep links · Personalization engine · LinkedIn message templates</p>
      </header>

      <div className="flex gap-1 bg-slate-200/50 p-1.5 rounded-xl w-fit border border-slate-200">
        {[
          { id: 'email', label: 'Email Templates' },
          { id: 'linkedin-msg', label: 'LinkedIn Messages' },
          { id: 'sequences', label: 'Follow-up Sequences' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2 rounded-lg text-[12.5px] font-bold transition-all ${
              activeTab === tab.id ? 'bg-white text-accent shadow-sm' : 'text-text-3 hover:text-text-2'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="card space-y-6">
            <div>
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-3">Email Type</div>
              <div className="space-y-2">
                {Object.entries(EMAIL_TEMPLATES).map(([id, t]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedTemplate(id as any)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTemplate === id 
                        ? 'bg-surface-2 border-accent text-accent' 
                        : 'bg-bg border-border text-text-3 hover:border-border-2'
                    }`}
                  >
                    <div className="font-medium text-[13px]">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">Personalize</div>
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Their first name" 
                  value={emName}
                  onChange={(e) => setEmName(e.target.value)}
                  className="input" 
                />
                <input 
                  type="text" 
                  placeholder="Company" 
                  value={emCompany}
                  onChange={(e) => setEmCompany(e.target.value)}
                  className="input" 
                />
                <input 
                  type="text" 
                  placeholder="Specific detail" 
                  value={emDetail}
                  onChange={(e) => setEmDetail(e.target.value)}
                  className="input" 
                />
                <input 
                  type="email" 
                  placeholder="Their email" 
                  value={emEmail}
                  onChange={(e) => setEmEmail(e.target.value)}
                  className="input" 
                />
              </div>
            </div>
            <button onClick={openGmail} className="btn btn-primary w-full gap-2">
              Open in Gmail <ExternalLink size={14} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10.5px] font-bold text-text-3 uppercase">Subject Line</label>
                <button onClick={() => navigator.clipboard.writeText(generateSubject())} className="text-accent text-[11px] hover:underline">Copy</button>
              </div>
              <input 
                readOnly 
                value={generateSubject()}
                className="input bg-bg border-border-2 font-medium" 
              />
            </div>

            <div className="card flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-text">Email Body</div>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(generateEmail())} className="btn btn-ghost btn-sm gap-2">
                    <Copy size={14} /> Copy
                  </button>
                  <button onClick={openGmail} className="btn btn-primary btn-sm gap-2">
                    Open in Gmail <Mail size={14} />
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={generateEmail()}
                className="w-full h-[350px] bg-bg border border-border-2 rounded-lg p-5 text-[12.5px] text-text-2 leading-relaxed outline-none resize-none custom-scrollbar font-sans"
              />
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg mt-4 flex gap-3 items-start">
                <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-[11.5px] text-blue-200/80 leading-normal">
                  <strong>Rules:</strong> Personalize every email (name + one specific detail). Max 15 cold emails/day. Follow up exactly 5 business days later.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'linkedin-msg' && (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 items-center">
            <Info size={18} className="text-blue-500 flex-shrink-0" />
            <p className="text-[13px] text-blue-200/80">
              LinkedIn connection messages must be under 300 characters. InMail can be longer.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { type: 'Connection Request (300 char max)', body: `Hi [Name], I came across your profile and noticed your work in [field] in Dubai. I'd love to connect — I'm in customer ops & sales, always keen to expand my UAE network. Movsum` },
              { type: 'Cold InMail — Hiring Manager', body: `Hi [Name], I'm reaching out as someone with 6+ years in UAE customer operations and sales (TASHAS, Four & More, Rego Group exhibitions). I'd value a brief conversation — happy to share my background at your convenience. calendly.com/contact-movsummirzazada` },
              { type: 'After Post Engagement', body: `Hi [Name], loved your post on [topic] — really resonated with my experience managing [similar situation] in Dubai. Would love to connect and continue the conversation.` },
              { type: 'Referral Request', body: `Hi [Name], I came across [Mutual Connection] mentioned you're the right person to talk to about [area]. I'm actively looking in UAE [industry] — would you be open to a 15-min call?` }
            ].map((m, i) => (
              <div key={i} className="card space-y-4">
                <div className="text-[10.5px] font-bold text-accent uppercase tracking-wider">{m.type}</div>
                <div className="text-[12.5px] text-text-2 leading-relaxed bg-bg p-3 rounded-lg border border-border">
                  {m.body}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(m.body)} className="btn btn-ghost btn-sm gap-2">
                    <Copy size={14} /> Copy
                  </button>
                  <button onClick={() => window.open('https://www.linkedin.com/messaging/', '_blank')} className="btn btn-primary btn-sm gap-2">
                    Open LinkedIn <Linkedin size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sequences' && (
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex gap-3 items-center">
            <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />
            <p className="text-[13px] text-yellow-200/80">
              A follow-up sequence turns 1 application into 3–5 touchpoints. Do not skip this step.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card space-y-4">
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">Application Follow-up Sequence</div>
              <div className="space-y-0">
                {[
                  { day: 'Day 0', action: 'Send application via portal or email', note: 'Use the cover letter builder' },
                  { day: 'Day 1', action: 'Connect with hiring manager on LinkedIn', note: 'Use the connection request template' },
                  { day: 'Day 5', action: 'Send follow-up email', note: 'Reference your application, express interest' },
                  { day: 'Day 10', action: 'Second LinkedIn message or email', note: 'Share a relevant article or insight' },
                  { day: 'Day 15', action: 'Final follow-up or mark as cold', note: 'One more brief touch, then move on' }
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 py-4 border-b border-border last:border-0">
                    <div className="text-[11px] text-accent font-mono w-14 flex-shrink-0">{s.day}</div>
                    <div>
                      <div className="font-medium text-[13px] text-text mb-1">{s.action}</div>
                      <div className="text-[11.5px] text-text-3 leading-relaxed">{s.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-4">
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">Cold Outreach Sequence</div>
              <div className="space-y-0">
                {[
                  { day: 'Day 0', action: 'Send cold email via Gmail', note: 'Personalized with name + specific detail' },
                  { day: 'Day 0', action: 'Connect on LinkedIn (separate message)', note: 'Never reference the email' },
                  { day: 'Day 5', action: 'Follow-up email: "Wanted to resurface this"', note: 'One sentence, no re-pitching' },
                  { day: 'Day 12', action: 'LinkedIn comment on their post', note: 'Genuine comment, no ask' },
                  { day: 'Day 20', action: 'Final email or DM — then pause', note: 'If no response after 3 touches, pause' }
                ].map((s, i) => (
                  <div key={i} className="flex gap-4 py-4 border-b border-border last:border-0">
                    <div className="text-[11px] text-accent-2 font-mono w-14 flex-shrink-0">{s.day}</div>
                    <div>
                      <div className="font-medium text-[13px] text-text mb-1">{s.action}</div>
                      <div className="text-[11.5px] text-text-3 leading-relaxed">{s.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
