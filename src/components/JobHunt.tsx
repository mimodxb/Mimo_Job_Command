import { useState } from 'react';
import { JOB_BOARDS, COVER_TEMPLATES, PROFILE } from '../constants';
import { Copy, ExternalLink, Mail, FileText, CheckCircle2 } from 'lucide-react';

export default function JobHunt() {
  const [activeTab, setActiveTab] = useState<'boards' | 'cover' | 'ats'>('boards');
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof COVER_TEMPLATES>('ops');
  const [clCompany, setClCompany] = useState('');
  const [clTitle, setClTitle] = useState('');
  const [clManager, setClManager] = useState('');
  const [clDetail, setClDetail] = useState('');
  const [clEmail, setClEmail] = useState('');

  const generateCoverLetter = () => {
    let body = COVER_TEMPLATES[selectedTemplate].body;
    body = body.replace(/\[Company\]/g, clCompany || '[Company]');
    body = body.replace(/\[Job Title\]/g, clTitle || '[Job Title]');
    body = body.replace(/\[Hiring Manager\]/g, clManager || '[Hiring Manager]');
    body = body.replace(/\[specific reason\]/g, clDetail || '[specific reason]');
    return body;
  };

  const copyCoverLetter = () => {
    navigator.clipboard.writeText(generateCoverLetter());
  };

  const openGmail = () => {
    const subject = COVER_TEMPLATES[selectedTemplate].subject
      .replace(/\[Job Title\]/g, clTitle || '[Job Title]');
    const body = generateCoverLetter();
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-2xl text-text">Job Hunt</h1>
        <p className="text-text-3 text-sm">UAE job boards · Cover letter builder · Pre-filled application flows</p>
      </header>

      <div className="flex gap-1 bg-slate-200/50 p-1.5 rounded-xl w-fit border border-slate-200">
        {[
          { id: 'boards', label: 'Job Boards' },
          { id: 'cover', label: 'Cover Letters' },
          { id: 'ats', label: 'ATS Tips' },
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

      {activeTab === 'boards' && (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex gap-3 items-center">
            <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
            <p className="text-[13px] text-green-200/80">
              All platforms below are free. Deep links open pre-filtered job searches.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {JOB_BOARDS.map((board, i) => (
              <div key={i} className="card flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-text text-[14px] flex items-center gap-2">
                      <span>{board.icon}</span> {board.name}
                    </div>
                    <div className="text-[11px] text-text-3 mt-0.5">{board.desc}</div>
                  </div>
                  <span className="badge badge-green">Free</span>
                </div>
                <div className="bg-bg p-2.5 rounded-lg border border-border text-[12px] text-text-4 mb-4 flex-1">
                  {board.note}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a href={board.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm justify-center">
                    Customer Ops →
                  </a>
                  <a href={board.searchUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm justify-center">
                    Sales / Retail →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'cover' && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="card space-y-6">
            <div>
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-3">Template Type</div>
              <div className="space-y-2">
                {Object.entries(COVER_TEMPLATES).map(([id, t]) => (
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
                  placeholder="Company name" 
                  value={clCompany}
                  onChange={(e) => setClCompany(e.target.value)}
                  className="input" 
                />
                <input 
                  type="text" 
                  placeholder="Job title" 
                  value={clTitle}
                  onChange={(e) => setClTitle(e.target.value)}
                  className="input" 
                />
                <input 
                  type="text" 
                  placeholder="Hiring manager" 
                  value={clManager}
                  onChange={(e) => setClManager(e.target.value)}
                  className="input" 
                />
                <input 
                  type="text" 
                  placeholder="Specific detail about them" 
                  value={clDetail}
                  onChange={(e) => setClDetail(e.target.value)}
                  className="input" 
                />
                <input 
                  type="email" 
                  placeholder="Their email (optional)" 
                  value={clEmail}
                  onChange={(e) => setClEmail(e.target.value)}
                  className="input" 
                />
              </div>
            </div>
          </div>

          <div className="card flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-text">Cover Letter Preview</div>
              <div className="flex gap-2">
                <button onClick={copyCoverLetter} className="btn btn-ghost btn-sm gap-2">
                  <Copy size={14} /> Copy
                </button>
                <button onClick={openGmail} className="btn btn-primary btn-sm gap-2">
                  Open in Gmail <Mail size={14} />
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={generateCoverLetter()}
              className="w-full flex-1 bg-bg border border-border-2 rounded-lg p-5 text-[12.5px] text-text-2 leading-relaxed outline-none resize-none custom-scrollbar font-sans"
              rows={20}
            />
          </div>
        </div>
      )}

      {activeTab === 'ats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-2">ATS Optimization — Pass the Robots</div>
            <div className="space-y-2">
              {[
                'Put exact job title from posting in your resume summary line',
                'Mirror keywords from the job description — ATS scans for exact matches',
                'Keep resume as .docx — some ATS systems fail to parse PDFs',
                'Spell out acronyms: "CRM (Customer Relationship Management)"',
                'No tables or columns in the ATS-upload version — they break parsing',
                'Standard fonts only: Calibri, Arial, Times — no decorative fonts',
                'Include months in employment dates: "Jan 2022 – Mar 2024"',
                'Minimum 70% keyword match before applying — adjust summary per role'
              ].map((tip, i) => (
                <div key={i} className="flex gap-3 p-3 bg-bg border border-border rounded-lg text-[12.5px] text-text-2 leading-relaxed">
                  <span className="text-accent font-mono font-bold">{i+1}.</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-2">Keyword Bank — Paste into your CV</div>
            <p className="text-[12px] text-text-3">Mirror these exact phrases from job postings. ATS scans for keyword matches.</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Customer Operations', 'Sales Coordinator', 'CRM Management', 'Retail Operations', 
                'Exhibition Sales', 'Lightspeed POS', 'B2B Sales', 'Account Management', 
                'Client Relations', 'KPI Management', 'Stock Management', 'Supplier Coordination', 
                'SOP Development', 'Team Leadership', 'Revenue Growth', 'Customer Retention', 
                'Upselling', 'Cross-selling', 'UAE Market', 'Multilingual'
              ].map((k, i) => (
                <span key={i} className="badge badge-gray px-3 py-1 border border-border">{k}</span>
              ))}
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText('Customer Operations · Sales Coordinator · CRM Management · Retail Operations · Exhibition Sales · Lightspeed POS · B2B Sales · Account Management · Client Relations · KPI Management · Stock Management · Supplier Coordination · SOP Development · Team Leadership · Revenue Growth · Customer Retention · Upselling · Cross-selling · UAE Market · Multilingual')}
              className="btn btn-ghost btn-sm w-full mt-2"
            >
              Copy All Keywords
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
