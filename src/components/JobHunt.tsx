import { useState } from 'react';
import { JOB_BOARDS, COVER_TEMPLATES, PROFILE } from '../constants';
import { Copy, ExternalLink, Mail, FileText, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { generateText, generateJSON } from '../lib/ai';

export default function JobHunt() {
  const [activeTab, setActiveTab] = useState<'boards' | 'cover' | 'ats' | 'ai' | 'optimizer'>('boards');
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof COVER_TEMPLATES>('ops');
  const [clCompany, setClCompany] = useState('');
  const [clTitle, setClTitle] = useState('');
  const [clManager, setClManager] = useState('');
  const [clDetail, setClDetail] = useState('');
  const [clEmail, setClEmail] = useState('');
  const [provider, setProvider] = useState<'gemini' | 'claude' | 'auto'>('auto');

  // AI States
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiCoverLetter, setAiCoverLetter] = useState('');

  // Optimizer States
  const [resumeText, setResumeText] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{ score: number; missingKeywords: string[]; suggestions: string[] } | null>(null);

  const handleGenerateAI = async () => {
    if (!jobDescription) return;

    setIsGenerating(true);
    setAiCoverLetter('');

    try {
      const prompt = `You are writing a highly tailored, professional cover letter for Movsum Mirzazada (Mimo). 
      
      User Profile:
      - Name: ${PROFILE.name}
      - Current Title: ${PROFILE.title}
      - Experience: 6+ years in UAE Customer Operations, Sales, CRM, and Retail Ops.
      - Key Achievements: 28% monthly sales growth at TASHAS, reduced order delays by 37% at Four & More, managed GITEX/Intersec exhibition sales.
      - Skills: AI Implementation (GPT/Make.com), Team Leadership, CRM, Multilingual (English, Azerbaijani, Turkish, Russian).
      - Location: Dubai, UAE (Immediate start, UAE Driving License).

      Job Description to tailor for:
      "${jobDescription}"

      Rules:
      - Tone: Professional, confident, and results-oriented.
      - Structure: 3-4 paragraphs.
      - Focus: Bridge the gap between his operational background and the specific requirements of the job description.
      - Highlight: Mention his AI automation skills if the role is tech-adjacent.
      - Call to Action: Mention availability for interview and his Calendly link: ${PROFILE.calendly}.
      - Output: Only the cover letter text. No subject line.`;

      const text = await generateText(prompt, { 
        model: 'gemini-1.5-flash',
        provider: provider 
      });
      
      setAiCoverLetter(text || "Error: No response from Gemini.");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Error generating cover letter. Please try again.";
      setAiCoverLetter(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeATS = async () => {
    if (!resumeText || !jobDescription) return;

    setIsOptimizing(true);
    setOptimizationResult(null);

    try {
      const prompt = `You are an expert ATS (Applicant Tracking System) Optimizer. Analyze the following Resume against the Job Description.
      
      Resume:
      "${resumeText}"

      Job Description:
      "${jobDescription}"

      Provide a JSON response with:
      1. score: A match score from 0-100.
      2. missingKeywords: An array of 5-10 critical keywords found in the JD but missing or weak in the resume.
      3. suggestions: An array of 3-5 specific bullet point improvements to the resume to better match this JD.

      Rules:
      - Focus on technical skills, tools, and industry-specific terminology.
      - Output ONLY valid JSON.`;

      const result = await generateJSON<{ score: number; missingKeywords: string[]; suggestions: string[] }>(prompt, { 
        model: 'gemini-1.5-flash',
        provider: provider 
      });
      setOptimizationResult(result);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Error optimizing ATS.";
      alert(errorMessage);
    } finally {
      setIsOptimizing(false);
    }
  };

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
          { id: 'ai', label: 'AI Builder' },
          { id: 'optimizer', label: 'ATS Optimizer' },
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
                <button 
                  onClick={() => setActiveTab('ai')} 
                  className="btn btn-ghost btn-sm gap-2 text-accent border-accent/20 hover:bg-accent/5"
                >
                  <Sparkles size={14} /> Tailor with AI
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

      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          <div className="card space-y-6 shadow-md">
            <div>
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-3">1. AI Provider</div>
              <div className="grid grid-cols-3 gap-2">
                {['auto', 'gemini', 'claude'].map(p => (
                  <button
                    key={p}
                    onClick={() => setProvider(p as any)}
                    className={`px-2 py-1.5 rounded-lg text-[10.5px] font-bold border transition-all ${
                      provider === p ? 'bg-accent text-white border-accent shadow-sm' : 'bg-white text-text-3 border-border hover:border-border-2'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-3">2. Paste Job Description</div>
              <textarea 
                placeholder="Paste the full job description here..." 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="input h-[300px] resize-none text-[12px] leading-relaxed font-medium" 
              />
            </div>
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating || !jobDescription}
              className="btn btn-primary w-full h-12 justify-center font-bold text-[14px] shadow-lg shadow-accent/20"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing & Writing...
                </div>
              ) : (
                <>Generate AI Cover Letter <Sparkles size={16} /></>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('optimizer')}
              className="btn btn-ghost w-full gap-2 text-[11px] font-bold"
            >
              <CheckCircle2 size={14} className="text-accent" /> Check ATS Match Score
            </button>
          </div>

          <div className="card flex flex-col shadow-lg border-accent/10 min-h-[500px]">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-[11px] font-bold text-text-3 uppercase tracking-wider">AI Generated Result</span>
              </div>
              {aiCoverLetter && (
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(aiCoverLetter)} className="btn btn-ghost btn-sm gap-2 font-bold">
                    <Copy size={14} /> Copy
                  </button>
                  <button onClick={() => {
                    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clEmail)}&su=${encodeURIComponent('Application: ' + clTitle)}&body=${encodeURIComponent(aiCoverLetter)}`;
                    window.open(url, '_blank');
                  }} className="btn btn-primary btn-sm gap-2 font-bold">
                    Open in Gmail <Mail size={14} />
                  </button>
                </div>
              )}
            </div>
            
            {!aiCoverLetter && !isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText size={32} className="text-text-3" />
                </div>
                <div className="text-[16px] font-bold text-text">No Content Yet</div>
                <p className="text-[13px] text-text-3 max-w-[300px] mt-2">Paste a job description on the left and let AI craft a perfect, tailored cover letter for you.</p>
              </div>
            ) : isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <div className="w-12 h-12 border-4 border-accent/10 border-t-accent rounded-full animate-spin mb-4" />
                <div className="text-[14px] font-bold text-text animate-pulse">Gemini is analyzing the job requirements...</div>
              </div>
            ) : (
              <textarea
                readOnly
                value={aiCoverLetter}
                className="w-full flex-1 bg-slate-50/50 border border-slate-100 rounded-xl p-6 text-[13px] text-text-2 leading-relaxed outline-none resize-none custom-scrollbar font-sans"
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'optimizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6">
          <div className="card space-y-6 shadow-md">
            <div className="flex items-center gap-2 text-text font-bold text-sm">
              <CheckCircle2 size={16} className="text-accent" /> ATS Optimization Engine
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-4 uppercase tracking-wider">AI Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {['auto', 'gemini', 'claude'].map(p => (
                    <button
                      key={p}
                      onClick={() => setProvider(p as any)}
                      className={`px-2 py-1.5 rounded-lg text-[10.5px] font-bold border transition-all ${
                        provider === p ? 'bg-accent text-white border-accent shadow-sm' : 'bg-white text-text-3 border-border hover:border-border-2'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-4 uppercase tracking-wider">Your Resume (Text)</label>
                <textarea 
                  placeholder="Paste your resume text here..." 
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="input h-[200px] resize-none text-[11px] leading-relaxed font-medium" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-4 uppercase tracking-wider">Job Description</label>
                <textarea 
                  placeholder="Paste the job description here..." 
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="input h-[200px] resize-none text-[11px] leading-relaxed font-medium" 
                />
              </div>
              <button 
                onClick={handleOptimizeATS}
                disabled={isOptimizing || !resumeText || !jobDescription}
                className="btn btn-primary w-full h-12 justify-center font-bold text-[14px] shadow-lg shadow-accent/20"
              >
                {isOptimizing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Calculating Match...
                  </div>
                ) : (
                  <>Analyze ATS Match <Sparkles size={16} /></>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {!optimizationResult && !isOptimizing ? (
              <div className="card flex flex-col items-center justify-center text-center p-20 opacity-30 border-dashed border-2">
                <CheckCircle2 size={48} className="text-text-3 mb-4" />
                <div className="text-[18px] font-bold text-text">Analysis Ready</div>
                <p className="text-[14px] text-text-3 max-w-[350px] mt-2">Paste your resume and the target job description to see how you rank against ATS algorithms.</p>
              </div>
            ) : isOptimizing ? (
              <div className="card flex flex-col items-center justify-center text-center p-20">
                <div className="w-16 h-16 border-4 border-accent/10 border-t-accent rounded-full animate-spin mb-6" />
                <div className="text-[16px] font-bold text-text animate-pulse">Gemini is simulating an ATS scan...</div>
                <p className="text-[13px] text-text-3 mt-2">Extracting keywords and comparing skill densities.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card flex flex-col items-center justify-center p-6 bg-accent/5 border-accent/20">
                    <div className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">ATS Match Score</div>
                    <div className={`text-4xl font-black ${optimizationResult.score > 75 ? 'text-green-500' : optimizationResult.score > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {optimizationResult.score}%
                    </div>
                  </div>
                  <div className="card md:col-span-2 p-6">
                    <div className="text-[10px] font-bold text-text-3 uppercase tracking-widest mb-3">Critical Missing Keywords</div>
                    <div className="flex flex-wrap gap-2">
                      {optimizationResult.missingKeywords.map((kw, i) => (
                        <span key={i} className="px-2 py-1 bg-red-50 text-red-600 border border-red-100 rounded text-[11px] font-bold uppercase tracking-wider">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center gap-2 text-text font-bold text-sm mb-4">
                    <Sparkles size={16} className="text-accent" /> Optimization Suggestions
                  </div>
                  <div className="space-y-3">
                    {optimizationResult.suggestions.map((sug, i) => (
                      <div key={i} className="flex gap-3 p-4 bg-bg border border-border rounded-xl group hover:border-accent transition-all">
                        <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-[12.5px] text-text-2 leading-snug font-medium">{sug}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
