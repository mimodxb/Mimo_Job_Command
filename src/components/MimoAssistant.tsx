/**
 * MimoAssistant.tsx — FIXED
 *
 * Security fix: Removed direct GoogleGenAI instantiation with client-side API key.
 * All AI calls now route through /api/ai (the Cloudflare Worker proxy).
 * The API key is never sent to or stored in the browser.
 */

import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Loader2,
  User,
  Bot,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateText } from '../lib/ai';
import { PROFILE } from '../constants';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MimoAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi Mimo! I'm your AI Career Assistant. How can I help you dominate the UAE job market today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<'gemini' | 'claude' | 'auto'>('auto');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const conversationHistory = messages
        .map((m) => `${m.role === 'user' ? 'Mimo' : 'Mimo AI'}: ${m.content}`)
        .join('\n');

      const prompt = `You are "Mimo AI", a highly intelligent career strategist and assistant for Movsum Mirzazada (Mimo).

Mimo's Profile:
- Name: ${PROFILE.name}
- Current Location: Dubai, UAE
- Background: 6+ years in Customer Operations, Retail Ops, Sales Strategy.
- Unique Edge: Internationally recognized actor (Cannes), AI Automation expert (Make.com/GPT).
- Goals: Secure a Senior Operations or Sales Strategy role in a tech-forward company in Dubai.

Your Tone:
- Professional, encouraging, and highly strategic.
- Use "we" and "us" to show partnership.
- Reference his specific achievements (28% sales growth, Cannes selection) when giving advice.

The User is Mimo himself. Answer his questions about:
1. Career advice in the UAE.
2. How to improve his LinkedIn or Resume.
3. How to use this "Mimo Command Center" app.
4. General motivation and strategy.

Keep responses concise and actionable.

Conversation History:
${conversationHistory}
Mimo: ${userMessage}
Mimo AI:`;

      const text = await generateText(prompt, { 
        model: 'gemini-1.5-flash',
        provider: provider 
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    } catch (err) {
      console.error('Assistant error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[380px] h-[550px] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          >
            <div className="bg-accent p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="font-display font-bold text-sm">Mimo AI Assistant</div>
                  <div className="flex items-center gap-2">
                    <select 
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as any)}
                      className="bg-white/10 text-[10px] border-none outline-none rounded px-1 font-medium cursor-pointer hover:bg-white/20 transition-colors"
                    >
                      <option value="auto" className="text-text">Auto</option>
                      <option value="gemini" className="text-text">Gemini</option>
                      <option value="claude" className="text-text">Claude</option>
                    </select>
                    <span className="text-[10px] opacity-60">•</span>
                    <div className="text-[10px] opacity-80 font-medium">
                      {provider === 'auto' ? 'Smart Routing' : provider === 'gemini' ? 'Gemini 1.5' : 'Claude 3.5'}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-2 max-w-[85%] ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                        msg.role === 'user'
                          ? 'bg-accent text-white'
                          : 'bg-white border border-border text-accent'
                      }`}
                    >
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-accent text-white rounded-tr-none'
                          : 'bg-white text-text border border-border rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-white border border-border text-accent flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={14} />
                    </div>
                    <div className="bg-white text-text border border-border p-3 rounded-2xl rounded-tl-none shadow-sm">
                      <Loader2 size={16} className="animate-spin text-accent" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-border">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Mimo AI anything..."
                  className="w-full bg-bg border border-border rounded-xl pl-4 pr-12 py-3 text-sm font-medium outline-none focus:border-accent transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-accent text-white rounded-lg disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-accent/20"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen
            ? 'bg-white text-accent border border-accent rotate-90'
            : 'bg-accent text-white shadow-accent/40'
        }`}
      >
        {isOpen ? <ChevronDown size={28} /> : <Sparkles size={28} />}
      </button>
    </div>
  );
}
