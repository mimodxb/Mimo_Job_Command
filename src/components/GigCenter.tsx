import { useState, useMemo } from 'react';
import { GIGS } from '../constants';
import { Gig } from '../types';
import { Copy, ExternalLink, CheckCircle2, AlertTriangle, Globe, Rocket, Share2, Search } from 'lucide-react';

export default function GigCenter() {
  const [activeTab, setActiveTab] = useState<'gigs' | 'promo' | 'platforms' | 'launch'>('gigs');
  const [selectedGig, setSelectedGig] = useState<Gig>(GIGS[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGigs = useMemo(() => {
    return GIGS.filter(gig => 
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.platform.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const copyGig = () => {
    navigator.clipboard.writeText(`TITLE:\n${selectedGig.title}\n\nDESCRIPTION:\n${selectedGig.description}\n\nTAGS:\n${selectedGig.tags}`);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-2xl text-text">Gig Center</h1>
        <p className="text-text-3 text-sm">Fiverr & Upwork gig copy · Promo posts · Platform launch checklist</p>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-slate-200/50 p-1.5 rounded-xl w-fit border border-slate-200">
          {[
            { id: 'gigs', label: 'Gig Descriptions' },
            { id: 'promo', label: 'Promo Posts' },
            { id: 'platforms', label: 'Platforms' },
            { id: 'launch', label: 'Launch Checklist' },
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

        {activeTab === 'gigs' && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-4" size={16} />
            <input
              type="text"
              placeholder="Search gigs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-2 text-sm font-medium outline-none focus:border-accent transition-all"
            />
          </div>
        )}
      </div>

      {activeTab === 'gigs' && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-3">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase ml-1">Select Gig</div>
            <div className="space-y-2">
              {filteredGigs.length > 0 ? (
                filteredGigs.map(gig => (
                  <button
                    key={gig.id}
                    onClick={() => setSelectedGig(gig)}
                    className={`w-full text-left p-4 rounded-xl border transition-all shadow-sm ${
                      selectedGig.id === gig.id 
                        ? 'bg-accent/5 border-accent ring-1 ring-accent/20' 
                        : 'bg-white border-border hover:border-border-2 hover:shadow-md'
                    }`}
                  >
                    <div className={`font-bold text-[13px] ${selectedGig.id === gig.id ? 'text-accent' : 'text-text'}`}>{gig.title}</div>
                    <div className="flex gap-2 mt-2">
                      <span className="badge badge-blue text-[9px]">{gig.platform}</span>
                      <span className="text-[10.5px] text-text-3 font-medium">· {gig.category}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center border-dashed border-2 border-border rounded-xl opacity-50">
                  <p className="text-[12px] text-text-3 font-medium">No gigs found matching "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>

          <div className="card space-y-6 shadow-md">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div className="font-bold text-text text-[16px]">{selectedGig.platform} Gig Details</div>
              <button onClick={copyGig} className="btn btn-primary btn-sm gap-2 font-bold">
                <Copy size={14} /> Copy All
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-3 uppercase tracking-wider ml-1">Gig Title</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[14px] text-text font-medium">
                  {selectedGig.title}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['Basic', 'Standard', 'Premium'] as const).map((tier) => {
                  const priceObj = selectedGig.pricing[tier];
                  return (
                    <div key={tier} className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                      <div className="text-[10px] text-text-3 font-bold uppercase mb-1 tracking-widest">{tier}</div>
                      <div className="text-[14px] font-bold text-accent">{priceObj.usd}</div>
                      <div className="text-[11px] text-text-3 font-medium mt-0.5">{priceObj.aed}</div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-3 uppercase tracking-wider ml-1">Description</label>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-[13.5px] text-text-2 leading-relaxed whitespace-pre-line max-h-[350px] overflow-y-auto custom-scrollbar font-medium">
                  {selectedGig.description}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-3 uppercase tracking-wider ml-1">Search Tags</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[12.5px] text-accent font-mono font-bold">
                  {selectedGig.tags}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <button 
                onClick={() => window.open('https://www.fiverr.com/users/movsummirzazada', '_blank')}
                className="btn btn-ghost btn-sm gap-2 font-bold"
              >
                View Fiverr Profile <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'promo' && (
        <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
          {GIGS.map(gig => (
            <div key={gig.id} className="card p-0 overflow-hidden shadow-lg border-slate-200 group">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-display font-bold shadow-sm shadow-accent/20">
                    M
                  </div>
                  <div>
                    <div className="font-bold text-[14px] text-text">Movsum Mirzazada</div>
                    <div className="text-[11px] text-text-3 font-medium">Customer Operations & Sales Specialist</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(gig.promo);
                    }} 
                    className="btn btn-ghost btn-sm gap-2 font-bold"
                  >
                    <Copy size={14} /> Copy Post
                  </button>
                  <button 
                    onClick={() => window.open('https://www.linkedin.com/feed/', '_blank')} 
                    className="btn btn-primary btn-sm gap-2 font-bold"
                  >
                    Post <Share2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 bg-white">
                <div className="text-[14.5px] text-text leading-relaxed whitespace-pre-line font-medium mb-6">
                  {gig.promo}
                </div>
                
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-4 group-hover:border-accent/30 transition-colors">
                  <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <div className="text-2xl">💼</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-accent uppercase tracking-wider mb-0.5">{gig.platform} GIG</div>
                    <div className="text-[14px] font-bold text-text truncate">{gig.title}</div>
                    <div className="text-[12px] text-text-3 font-medium truncate">
                      Starting from {gig.pricing.Basic.usd} ({gig.pricing.Basic.aed})
                    </div>
                  </div>
                  <ExternalLink size={18} className="text-text-4 group-hover:text-accent transition-colors" />
                </div>
              </div>

              <div className="bg-amber-50 p-4 border-t border-amber-100 flex gap-3 items-center">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
                <p className="text-[12.5px] text-amber-900 font-medium">
                  <strong className="text-amber-700">Strategy:</strong> Post this on LinkedIn, then immediately add your {gig.platform} link as the <span className="underline decoration-amber-400 decoration-2">first comment</span> to bypass the algorithm's link penalty.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'platforms' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex gap-3 items-center">
            <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            <p className="text-[13px] text-emerald-900 font-medium">
              All platforms listed have free tiers. No payment required to get started.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Fiverr', url: 'https://www.fiverr.com/users/movsummirzazada', tier: 'Free forever', icon: '🟢', note: 'Takes 20% commission. Strong UAE demand for CRM and operations services.' },
              { name: 'Upwork', url: 'https://www.upwork.com', tier: 'Free to join', icon: '🔵', note: 'Best for longer contracts and higher rates. Profile optimization is critical here.' },
              { name: 'PeoplePerHour', url: 'https://www.peopleperhour.com', tier: 'Free to join', icon: '🟡', note: 'Less competitive than Upwork. Good for UK/Europe clients.' },
              { name: 'LinkedIn Services', url: 'https://www.linkedin.com/services/', tier: 'Free, 0% commission', icon: '🔷', note: 'Enable via Creator Mode. Zero commission, direct leads from your network.' },
              { name: 'Contra', url: 'https://contra.com', tier: 'Free, 0% commission', icon: '⚪', note: 'No commission at all. Portfolio-focused. Growing quickly.' },
              { name: 'Freelancer.com', url: 'https://www.freelancer.com', tier: 'Free to join', icon: '🟠', note: 'High competition but high volume. Bid on projects in your niche.' }
            ].map((p, i) => (
              <div key={i} className="card flex items-start gap-4 p-5 shadow-sm hover:shadow-md transition-all border-slate-200 hover:border-accent/30">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-slate-100 shadow-inner">{p.icon}</div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text text-[15px]">{p.name}</span>
                    <span className="badge badge-green text-[9px]">{p.tier}</span>
                  </div>
                  <p className="text-[12.5px] text-text-3 leading-relaxed font-medium">{p.note}</p>
                </div>
                <button onClick={() => window.open(p.url, '_blank')} className="btn btn-ghost btn-sm p-2 rounded-full hover:bg-accent hover:text-white transition-colors">
                  <ExternalLink size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'launch' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-center">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
            <p className="text-[13.5px] text-amber-900 font-medium">
              Complete in order. Each step builds on the previous. Estimated: <span className="font-bold">3–4 hours</span> for full launch.
            </p>
          </div>
          <div className="card space-y-5 shadow-md">
            <div className="text-[11px] font-bold tracking-wider text-text-3 uppercase mb-2 ml-1">Freelance Platform Launch Checklist</div>
            <div className="space-y-2.5">
              {[
                { text: 'Create Fiverr account at fiverr.com/join', platform: 'Fiverr' },
                { text: 'Upload professional profile photo (remove.bg for clean background)', platform: 'Fiverr' },
                { text: 'Write Fiverr bio using your professional profile as base', platform: 'Fiverr' },
                { text: 'Create your first 3 Fiverr gigs from the Gig Center', platform: 'Fiverr' },
                { text: 'Create Upwork profile at upwork.com/i/register', platform: 'Upwork' },
                { text: 'Complete Upwork profile 100% (required for proposals)', platform: 'Upwork' },
                { text: 'Enable LinkedIn Services page (Creator Mode required)', platform: 'LinkedIn' },
                { text: 'Post your first gig promo on LinkedIn', platform: 'LinkedIn' },
                { text: 'Create Contra profile at contra.com', platform: 'Contra' },
                { text: 'Share services link in LinkedIn bio and website', platform: 'All' }
              ].map((s, i) => (
                <label key={i} className="flex items-center gap-3 p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl cursor-pointer group hover:bg-white hover:border-accent hover:shadow-sm transition-all">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-accent focus:ring-accent accent-accent" />
                  <span className="flex-1 text-[13px] text-text font-medium group-hover:text-accent transition-colors">{s.text}</span>
                  <span className="badge badge-gray text-[9px]">{s.platform}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
