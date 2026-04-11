import { useState } from 'react';
import { PILLARS } from '../constants';
import { Pillar } from '../types';
import { Sparkles, Copy, ExternalLink, Calendar, BookOpen, Zap, Loader2 } from 'lucide-react';
import { generateText, generateJSON } from '../lib/ai';

export default function ContentAI() {
  const [activeTab, setActiveTab] = useState<'generator' | 'newsletter' | 'hooks' | 'calendar'>('generator');
  const [selectedPillar, setSelectedPillar] = useState<Pillar>(PILLARS[1]);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('warm');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHook, setIsGeneratingHook] = useState(false);
  const [generatedPost, setGeneratedPost] = useState('');
  const [generatedHooks, setGeneratedHooks] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    setGeneratedPost('');

    try {
      const toneMap: Record<string, string> = {
        warm: 'warm, human, conversational',
        direct: 'direct, punchy, confident',
        reflective: 'reflective, thoughtful, vulnerable',
        professional: 'professional, insightful, authoritative',
        humorous: 'humorous, witty, slightly self-deprecating but professional',
        inspirational: 'inspirational, motivating, visionary'
      };

      const prompt = `You are writing a LinkedIn post for Movsum Mirzazada (Mimo), a Dubai-based customer operations and sales professional with 6+ years in UAE premium retail and hospitality. He is also an internationally recognized actor (Cannes Film Festival selection 2019, Best Male Actor at Moscow International Russian Film Festival 2019 for "End of Season" for the film "End of Season"). He founded Mimo's Collective. He speaks Azerbaijani, English, Turkish, Russian.

Write a LinkedIn post about: "${topic}"
Content pillar: ${selectedPillar.label} — ${selectedPillar.desc}
Tone: ${toneMap[tone]}

Rules:
- Start with a single punchy hook line (max 10 words)
- Short paragraphs, max 3-4 lines each
- No bullet points — tell a story or share an insight
- End with a genuine open question to readers
- NO hashtags in the body
- Length: 150–250 words
- Reference real credentials where relevant: TASHAS, Four & More, Rego Group, Cannes, AED 750K quarterly volume, 28% sales growth

Output only the post text, nothing else.`;

      const text = await generateText(prompt, { model: 'gemini-2.0-flash' });
      
      setGeneratedPost(text || "Error: No response from Gemini.");
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Error generating post. Please try again.";
      setGeneratedPost(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateHooks = async () => {
    setIsGeneratingHook(true);
    setGeneratedHooks([]);

    try {
      const prompt = `You are a viral LinkedIn content strategist. Generate 5 high-engagement "hooks" for Movsum Mirzazada (Mimo).
      
      User Profile:
      - Name: Movsum Mirzazada (Mimo)
      - Background: Customer Operations, Retail Ops, Actor, Founder of Mimo's Collective.
      - Achievements: 28% sales growth, Cannes selection, AI automation expert.

      Goal: Create hooks that stop the scroll. Use techniques like:
      - The "Contrarian" hook (e.g., "Why I stopped using CRM...")
      - The "Metric" hook (e.g., "How we hit 28% growth in 30 days...")
      - The "Vulnerable" hook (e.g., "The biggest mistake I made in retail...")
      - The "Visionary" hook (e.g., "The future of Dubai retail is AI, but not how you think...")

      Provide a JSON response with:
      1. hooks: An array of 5 strings.

      Output ONLY valid JSON.`;

      const result = await generateJSON<{ hooks: string[] }>(prompt, { model: 'gemini-2.0-flash' });
      setGeneratedHooks(result.hooks || []);
    } catch (error) {
      console.error(error);
      alert("Error generating hooks.");
    } finally {
      setIsGeneratingHook(false);
    }
  };

  const copyGenerated = () => {
    navigator.clipboard.writeText(generatedPost);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-2xl text-text">Content AI</h1>
        <p className="text-text-3 text-sm">AI-generated LinkedIn posts · Newsletter ideas · Hook templates</p>
      </header>

      <div className="flex gap-1 bg-slate-200/50 p-1.5 rounded-xl w-fit border border-slate-200">
        {[
          { id: 'generator', label: 'Post Generator' },
          { id: 'newsletter', label: 'Newsletter' },
          { id: 'hooks', label: 'Hook Templates' },
          { id: 'calendar', label: 'Content Calendar' },
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

      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          <div className="space-y-6">
            <div className="card shadow-md">
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-4">1. Select Pillar</div>
              <div className="space-y-2">
                {PILLARS.map(pillar => (
                  <button
                    key={pillar.id}
                    onClick={() => setSelectedPillar(pillar)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedPillar.id === pillar.id 
                        ? 'bg-accent/5 border-accent ring-1 ring-accent/20' 
                        : 'bg-white border-border hover:border-border-2 hover:shadow-sm'
                    }`}
                  >
                    <div className={`font-bold text-[13px] ${selectedPillar.id === pillar.id ? 'text-accent' : 'text-text'}`}>{pillar.label}</div>
                    <div className="text-[11px] text-text-3 mt-1 font-medium leading-tight">{pillar.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card shadow-md">
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-4">2. Configuration</div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-text-3 uppercase mb-1.5 ml-1">Topic / Insight</label>
                  <textarea
                    placeholder="What's the core message?"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="input h-24 resize-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text-3 uppercase mb-1.5 ml-1">Tone</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['warm', 'direct', 'reflective', 'professional', 'humorous', 'inspirational'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t as any)}
                        className={`px-3 py-2 rounded-lg text-[11.5px] font-bold border transition-all ${
                          tone === t ? 'bg-accent text-white border-accent shadow-sm' : 'bg-white text-text-3 border-border hover:border-border-2'
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic}
                  className="btn btn-primary w-full h-11 justify-center font-bold text-[14px] mt-2"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <>Generate Post <Sparkles size={16} /></>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card min-h-[500px] flex flex-col shadow-lg border-accent/20">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-[11px] font-bold text-text-3 uppercase tracking-wider">Generated Content</span>
                </div>
                {generatedPost && (
                  <div className="flex gap-2">
                    <button onClick={copyGenerated} className="btn btn-ghost btn-sm gap-2 font-bold">
                      <Copy size={14} /> Copy
                    </button>
                    <button onClick={() => window.open('https://www.linkedin.com/feed/', '_blank')} className="btn btn-primary btn-sm gap-2 font-bold">
                      Post <ExternalLink size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              {!generatedPost && !isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Sparkles size={32} className="text-text-3" />
                  </div>
                  <div className="text-[16px] font-bold text-text">Ready to Create</div>
                  <p className="text-[13px] text-text-3 max-w-[250px] mt-2">Configure your post on the left and click generate to see the magic.</p>
                </div>
              ) : isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                  <div className="w-12 h-12 border-4 border-accent/10 border-t-accent rounded-full animate-spin mb-4" />
                  <div className="text-[14px] font-bold text-text animate-pulse">Gemini is writing...</div>
                </div>
              ) : (
                <div className="flex-1 bg-slate-50/50 rounded-xl p-6 border border-slate-100">
                  <div className="prose prose-slate max-w-none">
                    <div className="text-[15px] text-text leading-relaxed whitespace-pre-wrap font-medium">
                      {generatedPost}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {activeTab === 'newsletter' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">The Mimo's Perspective — Topic Ideas</div>
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-[12px] text-blue-200/80 leading-relaxed">
              377 subscribers waiting. One article/month compounds authority. 400–600 words, one sharp observation → story → lesson → question.
            </div>
            <div className="space-y-2">
              {[
                "What 6 years in UAE premium retail actually taught me about people",
                "Why I moved to Dubai and what I didn't expect",
                "The difference between working in Baku and working in Dubai",
                "How acting on international stages changed how I handle pressure",
                "What exhibitions like GITEX taught me about B2B sales",
                "Why multilingual professionals have an advantage in UAE"
              ].map((topic, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-bg border border-border rounded-lg group hover:border-border-2 transition-all">
                  <span className="text-[13px] text-text-2">{i+1}. {topic}</span>
                  <button 
                    onClick={() => { setTopic(topic); setActiveTab('generator'); }}
                    className="text-accent text-[11px] font-medium hover:underline"
                  >
                    Use →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">Publishing Checklist</div>
            <div className="space-y-2">
              {[
                'Write article (400–600 words) in LinkedIn Newsletter editor',
                'Add cover image (use Canva — free templates)',
                'Publish article (subscribers notified automatically)',
                'Post 2-line teaser on your feed: state the insight, say "link in comments"',
                'Add article URL as first comment on teaser post',
                'Reply to every subscriber comment within 24 hours',
              ].map((step, i) => (
                <label key={i} className="flex items-start gap-3 p-3 bg-bg border border-border rounded-lg cursor-pointer group hover:border-border-2">
                  <input type="checkbox" className="mt-1 accent-accent" />
                  <span className="text-[12.5px] text-text-2 leading-tight group-hover:text-text transition-colors">{step}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hooks' && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">AI Smart Hooks</div>
              <button 
                onClick={handleGenerateHooks}
                disabled={isGeneratingHook}
                className="btn btn-ghost btn-xs gap-2 text-accent font-bold"
              >
                {isGeneratingHook ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Generate Fresh Hooks
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {generatedHooks.length > 0 ? (
                generatedHooks.map((hook, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-bg border border-border rounded-lg group hover:border-accent transition-all">
                    <div className="flex-1 mr-4">
                      <div className="text-[13px] text-text italic mb-1">"{hook}"</div>
                      <div className="text-[10.5px] text-text-4 font-bold uppercase tracking-wider">AI Generated</div>
                    </div>
                    <button 
                      onClick={() => { setTopic(hook); setActiveTab('generator'); }}
                      className="btn btn-ghost btn-sm px-2"
                    >
                      Use
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 text-center border-dashed border-2 border-border rounded-xl opacity-50">
                  <p className="text-[13px] text-text-3">Click "Generate Fresh Hooks" to get AI-powered scroll-stoppers tailored to your profile.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-4">Proven LinkedIn Hook Templates</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { pattern: "Pattern 1", hook: "I didn't expect [outcome] when I [action]." },
                { pattern: "Pattern 2", hook: "Most [professionals] lose [thing] not during [stage A] — but [stage B]." },
                { pattern: "Pattern 3", hook: "[Number] years ago, I [did something unexpected]. Here's what it taught me." },
                { pattern: "Pattern 4", hook: "The most underestimated [skill] in UAE [industry] isn't [obvious thing]." },
                { pattern: "Pattern 5", hook: "I started [project] because I kept [problem]. Here's where it led." },
                { pattern: "Pattern 6", hook: "Working in [context] in four languages isn't [misconception]. It's [real value]." },
                { pattern: "Pattern 7", hook: "[City] taught me something that [other city] never could." },
                { pattern: "Pattern 8", hook: "The day I [pivotal moment] changed how I think about [professional topic]." }
              ].map((h, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-bg border border-border rounded-lg group hover:border-accent transition-all">
                  <div>
                    <div className="text-[13px] text-text italic mb-1">"{h.hook}"</div>
                    <div className="text-[10.5px] text-text-4 font-bold uppercase tracking-wider">{h.pattern}</div>
                  </div>
                  <button 
                    onClick={() => { setTopic(h.hook); setActiveTab('generator'); }}
                    className="btn btn-ghost btn-sm px-2"
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="card">
          <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-4">2-Week Content Calendar</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const isPostDay = [1, 3, 5].includes(date.getDay());
              return (
                <div key={i} className={`p-3 rounded-lg border bg-bg min-h-[100px] flex flex-col ${isPostDay ? 'border-accent/40' : 'border-border'}`}>
                  <div className={`text-[10px] font-bold mb-2 ${isPostDay ? 'text-accent' : 'text-text-4'}`}>
                    {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <textarea 
                    placeholder={isPostDay ? "Post topic..." : "Engage day"}
                    className="w-full flex-1 bg-transparent border-none text-[11px] text-text-2 outline-none resize-none placeholder:text-text-4 leading-tight"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
