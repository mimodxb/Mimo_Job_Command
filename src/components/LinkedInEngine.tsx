import { useState } from 'react';
import { POSTS } from '../constants';
import { Post } from '../types';
import { Copy, ExternalLink, AlertTriangle, Info } from 'lucide-react';

export default function LinkedInEngine() {
  const [activeTab, setActiveTab] = useState<'posts' | 'schedule' | 'fixes' | 'actions'>('posts');
  const [selectedPost, setSelectedPost] = useState<Post>(POSTS[0]);
  const [postBody, setPostBody] = useState(POSTS[0].body);

  const handleSelectPost = (post: Post) => {
    setSelectedPost(post);
    setPostBody(post.body);
  };

  const copyPost = () => {
    navigator.clipboard.writeText(`${postBody}\n\n${selectedPost.tags}`);
  };

  const openLinkedIn = () => {
    window.open('https://www.linkedin.com/feed/', '_blank');
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display font-bold text-2xl text-text">LinkedIn Engine</h1>
        <p className="text-text-3 text-sm">Post library · Weekly schedule · Profile fixes · Deep links to LinkedIn actions</p>
      </header>

      <div className="flex gap-1 bg-slate-200/50 p-1.5 rounded-xl w-fit border border-slate-200">
        {[
          { id: 'posts', label: 'Post Library' },
          { id: 'schedule', label: 'Weekly Schedule' },
          { id: 'fixes', label: 'Profile Fixes' },
          { id: 'actions', label: 'Quick Actions' },
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

      {activeTab === 'posts' && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-3">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase ml-1">Select Post</div>
            <div className="space-y-2">
              {POSTS.map(post => (
                <button
                  key={post.id}
                  onClick={() => handleSelectPost(post)}
                  className={`w-full text-left p-4 rounded-xl border transition-all shadow-sm ${
                    selectedPost.id === post.id 
                      ? 'bg-accent/5 border-accent ring-1 ring-accent/20' 
                      : 'bg-white border-border hover:border-border-2 hover:shadow-md'
                  }`}
                >
                  <div className={`font-bold text-[13px] ${selectedPost.id === post.id ? 'text-accent' : 'text-text'}`}>{post.title}</div>
                  <div className="flex gap-2 mt-2">
                    <span className="badge badge-blue text-[9px]">{post.pillar}</span>
                    <span className="text-[10.5px] text-text-3 font-medium">· {post.timing}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-5 shadow-md">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="font-bold text-text text-[16px]">{selectedPost.title}</div>
                <div className="text-[12px] text-text-3 font-medium mt-1">{selectedPost.timing} GST · {selectedPost.pillar} pillar</div>
              </div>
              <div className="flex gap-2">
                <button onClick={copyPost} className="btn btn-ghost btn-sm gap-2 font-bold">
                  <Copy size={14} /> Copy Post
                </button>
                <button onClick={openLinkedIn} className="btn btn-primary btn-sm gap-2 font-bold">
                  Open LinkedIn <ExternalLink size={14} />
                </button>
              </div>
            </div>

            <textarea
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              className="w-full h-[350px] bg-slate-50 border border-slate-200 rounded-xl p-5 text-[14px] text-text leading-relaxed outline-none focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/5 transition-all resize-none custom-scrollbar font-medium"
            />

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-[10.5px] font-bold text-text-3 uppercase mb-2 tracking-wider">Hashtags — Paste as first comment:</div>
              <div className="text-accent font-mono text-[12.5px] font-bold leading-relaxed">{selectedPost.tags}</div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-[13px] text-amber-900 leading-normal font-medium">
                <strong className="text-amber-700">Rule:</strong> Never put hashtags or links in the post body. Add them as your <span className="underline decoration-amber-400 decoration-2">first comment</span> immediately after posting for maximum reach.
              </p>
            </div>
          </div>
        </div>
      )}


      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="card">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-4">Weekly Rhythm — 3 Posts/Week + Daily Engagement</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {[
                { day: 'Mon', action: 'Post: Story/Insight', time: '7:30 AM', type: 'post' },
                { day: 'Tue', action: '10 comments · 5 connections', time: 'Morning', type: 'engage' },
                { day: 'Wed', action: 'Post: Professional tip', time: '8:00 AM', type: 'post' },
                { day: 'Thu', action: '10 comments · 5 connections', time: 'Morning', type: 'engage' },
                { day: 'Fri', action: 'Post: Personal story/win', time: '8:00 AM', type: 'post' },
                { day: 'Sat', action: 'Light engagement', time: 'Anytime', type: 'rest' },
                { day: 'Sun', action: 'Weekly review + write', time: '30 min', type: 'review' },
              ].map((d, i) => (
                <div key={i} className={`p-3 rounded-lg border bg-bg ${
                  d.type === 'post' ? 'border-t-2 border-t-accent' : 
                  d.type === 'engage' ? 'border-t-2 border-t-green-500' : 
                  d.type === 'review' ? 'border-t-2 border-t-yellow-500' : 'border-border'
                }`}>
                  <div className="text-[10.5px] font-bold text-text-3 mb-2">{d.day}</div>
                  <div className="text-[11.5px] text-text-2 leading-tight mb-1.5">{d.action}</div>
                  <div className="text-[10.5px] text-text-4">{d.time}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase mb-4">Daily Morning Routine (20 Min)</div>
            <div className="space-y-0">
              {[
                { time: '08:00', task: 'Comment on 5–7 Dubai professional posts (2–3 sentences)', tag: 'Highest ROI' },
                { time: '08:10', task: 'Reply to all notifications on your own posts within the hour', tag: 'Algorithm' },
                { time: '08:20', task: 'Send 2–3 personalized connection requests (sales managers, HR)', tag: 'Network' },
                { time: '08:30', task: 'On post days: publish, then seed post to 3–5 DM contacts', tag: 'Post days only' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                  <div className="text-[11px] text-accent font-mono w-12">{s.time}</div>
                  <div className="flex-1 text-[12.5px] text-text-2">{s.task}</div>
                  <span className="badge badge-blue">{s.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fixes' && (
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex gap-3 items-center">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
            <p className="text-[13px] text-red-200/80">
              <strong>CRITICAL:</strong> Complete all fixes before posting. Without these, new eyes won't convert to followers.
            </p>
          </div>
          <div className="card">
            <div className="text-[10.5px] font-bold tracking-wider text-red-500 uppercase mb-4">Profile Fix Checklist</div>
            <div className="space-y-2">
              {[
                'Rewrite headline: "Customer Operations & Sales | CRM | Exhibition Sales | Retail Ops | Dubai, UAE"',
                'Enable Creator Mode (Settings → Visibility → Creator Mode)',
                'Enable Open to Work (Recruiters only)',
                'Update LinkedIn banner with name + title',
                'Add skills: CRM, Retail Operations, Exhibition Sales, Lightspeed POS',
                'Request 3 LinkedIn recommendations from past managers',
                'Add Calendly link to Contact Info section',
                'Enable LinkedIn Newsletter and publish first article',
              ].map((fix, i) => (
                <label key={i} className="flex items-start gap-3 p-3 bg-bg border border-border rounded-lg cursor-pointer group hover:border-border-2">
                  <input type="checkbox" className="mt-1 accent-accent" />
                  <span className="text-[13px] text-text-2 leading-tight group-hover:text-text transition-colors">{fix}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 items-center">
            <Info size={18} className="text-blue-500 flex-shrink-0" />
            <p className="text-[13px] text-blue-200/80">
              These buttons open LinkedIn directly at the correct page for each action.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">Profile Actions</div>
              {[
                { label: 'Edit Headline', sub: 'Update with UAE keywords', url: 'https://www.linkedin.com/in/movsummirzazada/edit/intro/' },
                { label: 'Enable Creator Mode', sub: 'Settings → Visibility → Creator Mode', url: 'https://www.linkedin.com/settings/visibility/' },
                { label: 'Open to Work', sub: 'Set to Recruiters Only', url: 'https://www.linkedin.com/settings/job-seeking-preferences/' },
                { label: 'Update Profile Photo', sub: 'Update banner + profile picture', url: 'https://www.linkedin.com/in/movsummirzazada/edit/photo/' },
                { label: 'Add Skills', sub: 'CRM, Retail Ops, Exhibition Sales, Lightspeed', url: 'https://www.linkedin.com/in/movsummirzazada/edit/skills/' },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => window.open(action.url, '_blank')}
                  className="w-full flex items-center justify-between p-3 bg-surface-2 border border-border-2 rounded-lg hover:border-accent hover:bg-surface transition-all group"
                >
                  <div className="text-left">
                    <div className="font-medium text-[12.5px] text-text">{action.label}</div>
                    <div className="text-[11px] text-text-3 mt-0.5">{action.sub}</div>
                  </div>
                  <ExternalLink size={14} className="text-text-3 group-hover:text-accent" />
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div className="text-[10.5px] font-bold tracking-wider text-text-3 uppercase">Content & Network</div>
              {[
                { label: 'Create New Post', sub: 'Opens LinkedIn compose window', url: 'https://www.linkedin.com/feed/' },
                { label: 'Manage Connections', sub: 'Accept / send invitations', url: 'https://www.linkedin.com/mynetwork/invitation-manager/' },
                { label: 'Search Dubai Sales Managers', sub: 'Pre-filtered people search', url: 'https://www.linkedin.com/search/results/people/?geoUrn=%5B%22101319002%22%5D&keywords=sales%20manager&origin=FACETED_SEARCH' },
                { label: 'Search Dubai HR Recruiters', sub: 'Pre-filtered people search', url: 'https://www.linkedin.com/search/results/people/?geoUrn=%5B%22101319002%22%5D&keywords=HR+recruiter&origin=FACETED_SEARCH' },
                { label: 'Manage Newsletter', sub: 'The Mimo Perspective — 377 subs', url: 'https://www.linkedin.com/newsletters/' },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => window.open(action.url, '_blank')}
                  className="w-full flex items-center justify-between p-3 bg-surface-2 border border-border-2 rounded-lg hover:border-accent hover:bg-surface transition-all group"
                >
                  <div className="text-left">
                    <div className="font-medium text-[12.5px] text-text">{action.label}</div>
                    <div className="text-[11px] text-text-3 mt-0.5">{action.sub}</div>
                  </div>
                  <ExternalLink size={14} className="text-text-3 group-hover:text-accent" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
