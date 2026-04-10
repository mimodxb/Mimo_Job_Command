import { useState, useRef } from 'react';
import { Download, Sparkles, Layout, Palette, Type, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import html2canvas from 'html2canvas';

export default function BannerDesigner() {
  const [name, setName] = useState('MOVŠUM MIRZAZADA');
  const [title, setTitle] = useState('Retail Operations & AI Strategy');
  const [status, setStatus] = useState('OPEN TO NEW OPPORTUNITIES');
  const [theme, setTheme] = useState<'midnight' | 'cyber' | 'minimal'>('midnight');
  const [isDownloading, setIsDownloading] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const themes = {
    midnight: {
      bg: 'bg-slate-950',
      gradient: 'from-slate-950 via-indigo-950 to-slate-950',
      accent: 'text-accent',
      border: 'border-accent/30',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]',
    },
    cyber: {
      bg: 'bg-black',
      gradient: 'from-black via-purple-950 to-black',
      accent: 'text-purple-400',
      border: 'border-purple-500/30',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.2)]',
    },
    minimal: {
      bg: 'bg-white',
      gradient: 'from-slate-50 to-white',
      accent: 'text-slate-900',
      border: 'border-slate-200',
      glow: 'shadow-sm',
    }
  };

  const currentTheme = themes[theme];

  const handleDownload = async () => {
    if (!bannerRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(bannerRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = `linkedin-banner-${theme}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-xl text-text">LinkedIn Banner Designer</h2>
          <p className="text-text-3 text-xs mt-1">Generate a professional 'Open to Work' banner matching your brand.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn btn-primary btn-sm gap-2 text-[11px] font-bold shadow-lg shadow-accent/20"
          >
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isDownloading ? 'Generating...' : 'Download PNG'}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="relative group">
        <div 
          ref={bannerRef}
          className={`w-full aspect-[4/1] rounded-2xl overflow-hidden border ${currentTheme.border} ${currentTheme.glow} transition-all duration-500 relative`}
        >
          {/* Background Pattern */}
          <div className={`absolute inset-0 bg-gradient-to-r ${currentTheme.gradient}`}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            {theme !== 'minimal' && (
              <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className={currentTheme.accent} />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <h1 className={`font-display font-black text-3xl md:text-5xl tracking-tighter ${theme === 'minimal' ? 'text-slate-900' : 'text-white'}`}>
                  {name}
                </h1>
                <div className={`flex items-center justify-center gap-3 font-mono text-[10px] md:text-xs tracking-[0.3em] uppercase font-bold ${currentTheme.accent}`}>
                  <span className="opacity-50">[</span>
                  {title}
                  <span className="opacity-50">]</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4">
                <div className={`px-4 py-1.5 rounded-full border ${currentTheme.border} bg-white/5 backdrop-blur-md flex items-center gap-2`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${theme === 'minimal' ? 'bg-accent' : 'bg-accent'}`}></div>
                  <span className={`text-[10px] font-black tracking-widest uppercase ${theme === 'minimal' ? 'text-slate-600' : 'text-slate-300'}`}>
                    {status}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* HUD Elements (Cyber/Midnight only) */}
          {theme !== 'minimal' && (
            <>
              <div className="absolute top-4 left-4 font-mono text-[8px] text-white/20 space-y-1 uppercase tracking-widest">
                <div>System: Mimo Command</div>
                <div>Status: Active</div>
                <div>Region: Dubai, UAE</div>
              </div>
              <div className="absolute bottom-4 right-4 font-mono text-[8px] text-white/20 flex gap-4 uppercase tracking-widest">
                <div className="flex items-center gap-1"><ShieldCheck size={8} /> Verified</div>
                <div>v4.10.26</div>
              </div>
            </>
          )}
        </div>
        
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white border border-border px-3 py-1 rounded-full shadow-sm text-[10px] font-bold text-text-3 opacity-0 group-hover:opacity-100 transition-opacity">
          LinkedIn Preview (1584 x 396)
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-4">
          <div className="flex items-center gap-2 text-text font-bold text-sm">
            <Palette size={16} className="text-accent" /> Theme Selection
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['midnight', 'cyber', 'minimal'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`p-3 rounded-xl border-2 transition-all capitalize text-[11px] font-bold ${
                  theme === t ? 'border-accent bg-accent/5 text-accent' : 'border-border bg-white text-text-3 hover:border-border-2'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-text font-bold text-sm">
            <Type size={16} className="text-accent" /> Content Customization
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-4 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-4 uppercase tracking-wider">Professional Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent transition-all"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-text-4 uppercase tracking-wider">Status Text</label>
              <input 
                type="text" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
        <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-[13px] text-blue-900 font-bold">Pro Tip: Screenshot for LinkedIn</p>
          <p className="text-[12px] text-blue-800 leading-relaxed">
            Since this is a live preview, the best way to use it is to take a high-resolution screenshot of the banner area and upload it directly to your LinkedIn profile.
          </p>
        </div>
      </div>
    </div>
  );
}

function Info({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
