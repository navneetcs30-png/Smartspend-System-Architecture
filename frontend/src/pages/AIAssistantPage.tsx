import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { SpendingInsight } from '../types';
import { formatINR } from '../utils/formatters';
import { 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  Lightbulb
} from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  suggestedActions?: string[];
}

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: "Hello! I am your **SmartSpend AI Financial Analyst**. I have direct access to your verified financial transactions and deterministic analytical tools. How can I help you optimize your spending or savings today?",
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Where did my money go this month?',
        'What are my largest expenses?',
        'Am I staying within budget?',
        'How can I save ₹5,000 next month?'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadInsights = async () => {
    try {
      const res = await api.get('/ai/insights');
      setInsights(res.data);
    } catch {
      // silent
    }
  };

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: q });
      const botMsg: ChatMessage = {
        sender: 'assistant',
        text: res.data.response,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: res.data.suggested_actions
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Sorry, I encountered an issue retrieving verified analytics. Please try again.',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Deterministic Tool Calling (Zero Hallucinated Numbers)</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">AI Financial Analyst</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Ask questions about your ledger, discover avoidable spends, and receive personalized savings recommendations.
        </p>
      </div>

      {/* Proactive Wastage Detection Cards */}
      {insights.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-900/60 shadow-lg text-white">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Lightbulb className="w-4 h-4" />
            <span>Proactive Wastage & Optimization Opportunities</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {insights.map((ins) => (
              <div key={ins.id} className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-100">{ins.title}</span>
                  {ins.potential_savings_inr > 0 && (
                    <span className="font-bold text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Save +{formatINR(ins.potential_savings_inr)}
                    </span>
                  )}
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{ins.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[600px] overflow-hidden">
        {/* Chat Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20'
                    : 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4 text-slate-950" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-emerald-500/15'
                      : 'bg-slate-100 dark:bg-[#121A2B] text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-white/[0.08] shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                </div>

                {/* Suggested Action Chips */}
                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.suggestedActions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSend(act)}
                        className="text-[11px] font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-white/[0.08] dark:hover:border-emerald-500/30 transition-all active:scale-95"
                      >
                        {act}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-slate-400 block px-1">{m.time}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#121A2B] text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Executing verified database query tools...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/[0.07] bg-slate-50/70 dark:bg-[#090E17]/80 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask anything (e.g. 'How much did I spend on Swiggy?', 'Can I save ₹5,000 next month?')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/[0.1] bg-white dark:bg-[#121A2B] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-bold disabled:opacity-50 transition-all shadow-md shadow-emerald-500/20"
            >
              <Send className="w-4 h-4 text-slate-950" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
