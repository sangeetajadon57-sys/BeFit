import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, MessageCircle, AlertTriangle, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import { Message, UserProfile, CalculationResult } from '../types';

interface ChatAssistantProps {
  userProfile: UserProfile | null;
  currentMetrics: CalculationResult | null;
}

export default function ChatAssistant({ userProfile, currentMetrics }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'assistant',
      text: `Hello! I am your **Be Fit AI Coach**. 🌟\n\n${
        userProfile 
          ? `I have synced with your profile data and calculated health metrics. I can explain what your BMI or Body Fat % means, suggest balanced nutrition habits, and recommend customized exercise structures based on your goal: **"${userProfile.goal.replace('_', ' ')}"**.\n\n`
          : 'Please complete your Profile or Onboarding tab first, so I can give personalized metrics advice! '
      }How can I support your fitness journey today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isQuerying]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isQuerying) return;

    if (!customText) {
      setInputText('');
    }

    const userMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsQuerying(true);

           try {
      const chatHistory = [...messages, userMsg].map(m => 
        `${m.sender === 'user' ? 'User' : 'Model'}: ${m.text}`
      ).join('\n');

      const systemPrompt = `You are an expert fitness coach and nutritionist. User Profile: ${JSON.stringify(userProfile)}. Current Metrics: ${JSON.stringify(currentMetrics)}. Chat History:\n${chatHistory}\nModel:`;

      const apiKey = "import.meta.env.VITE_GEMINI_API_KEY";
      const cleanKey = apiKey.replace(/['"]/g, '');
      
      const response = await fetch(`https://googleapis.com{cleanKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error('Could not establish contact with AI Fitness server.');
      }

      const data = await response.json();
      const aiResponseText = data.candidates[0]?.content?.parts[0]?.text || "I'm having trouble processing that advice right now.";

      const assistantMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: data.text || "I appreciate you checking in. Let's redirect our wellness focus.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);

    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: "My apologies, I am having a brief metabolic timeout. Let's try saying that again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  // Preset quick recommendations
  const quickPrompts = [
    { label: 'Explain BMI Range Simply', text: 'Explain what my Body Mass Index (BMI) means in simple words, and give me key habits.' },
    { label: 'Healthy Nutrition Habits', text: 'What are balanced nutrition recipes or portion guides to support whole-body health?' },
    { label: 'Sustainable Cardio Rules', text: 'Provide 3 sustainable cardiovascular routines that support joint safety and daily stamina.' },
    { label: 'Resting BMR Vs TDEE Needs', text: 'What is BMR and how does moving more change my TDEE calorie requirements?' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[550px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden select-none relative z-10">
      
      {/* Header */}
      <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-slate-950 relative">
            <MessageCircle className="w-4 h-4 font-bold" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-slate-950 rounded-full" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs sm:text-sm">Be Fit AI Health Coach</h3>
            <p className="text-[10px] text-slate-400 font-mono">Friendly Specialized AI Wellness Support</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          Secure Chat
        </div>
      </div>

      {/* Messages Scroll Box */}
      <div className="flex-1 p-4 overflow-y-auto bg-transparent space-y-4 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm whitespace-pre-line leading-relaxed font-light ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold rounded-br-none'
                  : 'bg-white/5 text-slate-100 border border-white/10 rounded-bl-none'
              }`}
            >
              <div className="text-xs font-normal">
                {/* Parse simple mock markdown for formatting: bolding */}
                {msg.text.split('**').map((chunk, i) => (
                  i % 2 === 1 ? <strong key={i} className="font-semibold text-emerald-300">{chunk}</strong> : chunk
                ))}
              </div>
              <span className={`block text-[8px] mt-1.5 font-mono text-right ${msg.sender === 'user' ? 'text-slate-850' : 'text-slate-400'}`}>
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Loading/Querying state indicator */}
        {isQuerying && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-[10px] text-slate-400 font-mono animate-pulse">Coach is formulating healthy options...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recommended Question tags */}
      {messages.length < 3 && !isQuerying && (
        <div className="px-4 py-3 bg-white/5 border-t border-white/10 flex flex-wrap gap-2">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p.text)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-emerald-500/30 rounded-full text-[10px] font-medium transition cursor-pointer"
            >
              <HelpCircle className="w-3 h-3 text-emerald-400" />
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Form Box */}
      <div className="p-3 bg-white/5 border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputText}
            aria-label="Ask your AI Fitness Coach"
            onChange={(e) => setInputText(e.target.value)}
            disabled={isQuerying}
            placeholder="Ask about healthy BMR, home exercises, meal protein ratios..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 focus:bg-white/10 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isQuerying}
            style={{ opacity: !inputText.trim() ? 0.6 : 1 }}
            className="p-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl shadow transition cursor-pointer flex items-center justify-center shrink-0 font-bold"
            aria-label="Send message button"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        
        {/* Support disclaimer banner */}
        <p className="text-[9px] text-slate-400 text-center font-normal leading-normal mt-2 italic flex items-center justify-center gap-1 select-none">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          Coach estimates represent supportive guidelines only and do not replace professional medical evaluations.
        </p>
      </div>

    </div>
  );
}
