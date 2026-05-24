import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, MessageCircle, AlertTriangle, ShieldCheck, HelpCircle, Loader2, WifiOff } from 'lucide-react';
import { Message, UserProfile, CalculationResult } from '../types';
import { getApiUrl } from '../utils/api';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

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

  const buildApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  const localApiKey = typeof window !== 'undefined' 
    ? localStorage.getItem('VITE_GEMINI_API_KEY') || localStorage.getItem('user_gemini_api_key') || '' 
    : '';
  const hasApiKey = !!((buildApiKey && buildApiKey.trim() !== "" && buildApiKey !== "MY_GEMINI_API_KEY") || localApiKey.trim());

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

    // Timeout response if on extremely lagging 3G or low reception
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds response timeout for mobile

    try {
      const chatHistory = [...messages, userMsg];
      const dynamicApiKey = typeof window !== 'undefined' 
        ? localStorage.getItem('VITE_GEMINI_API_KEY') || localStorage.getItem('user_gemini_api_key') || ''
        : '';
      const clientApiKey = dynamicApiKey.trim() || ((buildApiKey && buildApiKey.trim() !== "" && buildApiKey !== "MY_GEMINI_API_KEY") ? buildApiKey.trim() : '');

      let aiText = '';

      if (clientApiKey && clientApiKey !== "") {
        // Reconstruct user context strings directly on client
        let contextStr = "The user has not calculated metrics yet.";
        if (userProfile) {
          contextStr = `The user's profile:
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Height: ${userProfile.height} cm (${(userProfile.height / 2.54).toFixed(1)} inches)
- Weight: ${userProfile.weight} kg (${(userProfile.weight * 2.20462).toFixed(1)} lbs)
- Unit system preference: ${userProfile.unitSystem}`;

          if (userProfile.waist) {
            contextStr += `\n- Waist: ${userProfile.waist} cm`;
          }
          contextStr += `\n- Goal: ${userProfile.goal}\n- Activity: ${userProfile.activityLevel}`;
        }

        if (currentMetrics) {
          contextStr += `\n\nLatest Calculated Metrics:
- BMI: ${currentMetrics.bmi?.value} (${currentMetrics.bmi?.category})
- Body Fat %: ${currentMetrics.bodyFat ? `${currentMetrics.bodyFat.value}% (${currentMetrics.bodyFat.category})` : 'Not entered'}
- BMR: ${currentMetrics.bmr?.value} kcal/day (Basal metabolic energy needs)
- TDEE: ${currentMetrics.tdee?.value} kcal/day (Estimated calorie intake for custom level)
- Healthy Weight Range: ${currentMetrics.healthyWeightRange?.min} - ${currentMetrics.healthyWeightRange?.max} ${currentMetrics.healthyWeightRange?.unit}`;
          
          if (currentMetrics.waistToHeight) {
            contextStr += `\n- Waist-to-Height Ratio: ${currentMetrics.waistToHeight.value} (${currentMetrics.waistToHeight.category})`;
          }
        }

        const systemInstructionText = `You are "Be Fit AI Coach", a supportive, certified fitness specialist, and wellness guide.
Your purpose is to explain fitness metrics, suggest healthier habits, answer general health queries, and explain charts simply.

Guidelines:
1. Speak in friendly, encouraging, and respectful language. Keep descriptions highly readable (use bold text, bullet points).
2. Focus strictly on holistic wellness metrics—do not promote extreme calorie reductions, crash diets, or obsessive appearance goals. Recommend sustainable fitness, hydration, lean nutrition, movement variety, and good sleep.
3. Be transparent that these are estimates. ALWAYS include this supportive disclaimer softly at the end: "Disclaimer: This feedback represents general wellness suggestions and is not a medical diagnosis. Please consult a health practitioner for serious health changes."
4. If the user asks a fully unrelated, non-fitness, or non-medical question (e.g. coding or writing a joke), politely redirect them back to health, fitness, or diet: "As your Be Fit AI Coach, I specialize in fitness, nutrition, and wellness. Let gets back to your health goals!"

User Context:
${contextStr}`;

        // Map messages to Gemini REST schema, starting from first user message
        const firstUserIdx = chatHistory.findIndex(msg => msg.sender === 'user');
        let contextPrepended = false;
        const geminiContents = chatHistory.slice(firstUserIdx >= 0 ? firstUserIdx : 0).map(msg => {
          let text = msg.text;
          // Prepend system guidelines and user context to the first user message in the payload
          if (!contextPrepended && msg.sender === 'user') {
            text = `[SYSTEM INSTRUCTIONS & USER GUIDELINES]\n${systemInstructionText}\n\n[USER INQUIRY]\n${msg.text}`;
            contextPrepended = true;
          }
          return {
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text }]
          };
        });

        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${clientApiKey}`;
        const reqPayload = {
          contents: geminiContents,
          generationConfig: {
            temperature: 0.7
          }
        };

        if (Capacitor.isNativePlatform()) {
          const capResponse = await CapacitorHttp.post({
            url: directUrl,
            headers: { 'Content-Type': 'application/json' },
            data: reqPayload
          });

          if (capResponse.status !== 200) {
            let errorMsg = 'Direct Gemini communication issue.';
            if (capResponse.data && typeof capResponse.data === 'object' && capResponse.data.error?.message) {
              errorMsg = `API Error: ${capResponse.data.error.message}`;
            } else if (capResponse.data && typeof capResponse.data === 'string') {
              try {
                const parsedJson = JSON.parse(capResponse.data);
                if (parsedJson?.error?.message) {
                  errorMsg = `API Error: ${parsedJson.error.message}`;
                }
              } catch (_) {}
            }
            throw new Error(errorMsg);
          }

          let data = capResponse.data;
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
            } catch (_) {}
          }
          aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (!aiText && data?.text) {
            aiText = data.text;
          }
        } else {
          const response = await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqPayload),
            signal: controller.signal
          });

          if (!response.ok) {
            let errorMsg = 'Direct Gemini communication issue.';
            try {
              const errJson = await response.json();
              if (errJson.error?.message) {
                errorMsg = `API Error: ${errJson.error.message}`;
              }
            } catch (_) {}
            throw new Error(errorMsg);
          }

          let rawResponseText = '';
          try {
            rawResponseText = await response.text();
            const data = JSON.parse(rawResponseText);
            aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (!aiText && data?.text) {
              aiText = data.text;
            }
          } catch (jsonErr) {
            console.error("Failed to parse direct Gemini JSON response, using fallback text:", jsonErr);
            aiText = rawResponseText || "My apologies, I received an invalid response format from the Gemini API.";
          }
        }

      } else {
        // Resolve the API URL which securely routes to absolute Cloud Run when in local APK mode
        const targetApiUrl = getApiUrl('/api/chat');
        const reqPayload = {
          messages: chatHistory,
          userProfile,
          currentMetrics
        };

        if (Capacitor.isNativePlatform()) {
          const capResponse = await CapacitorHttp.post({
            url: targetApiUrl,
            headers: { 'Content-Type': 'application/json' },
            data: reqPayload
          });

          if (capResponse.status !== 200) {
            throw new Error('Could not establish contact with AI Fitness server.');
          }

          let data = capResponse.data;
          if (typeof data === 'string') {
            try {
              data = JSON.parse(data);
            } catch (_) {}
          }
          aiText = data?.text || data?.aiText || '';
        } else {
          const response = await fetch(targetApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqPayload),
            signal: controller.signal
          });

          if (!response.ok) {
            throw new Error('Could not establish contact with AI Fitness server.');
          }

          let rawProxyText = '';
          try {
            rawProxyText = await response.text();
            const data = JSON.parse(rawProxyText);
            aiText = data.text || data.aiText || '';
          } catch (jsonErr) {
            console.error("Failed to parse backend chat response, using raw text:", jsonErr);
            aiText = rawProxyText || "Empty response received from connection.";
          }
        }
      }

      clearTimeout(timeoutId);
      
      const assistantMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: aiText || "I appreciate you checking in. Let's redirect our wellness focus.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);

    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error(err);
      
      let failText = "My apologies, I am having a brief metabolic timeout. Let's try saying that again in a moment.";
      if (err.name === 'AbortError') {
        failText = "📡 **Signal Timeout**: The request took too long due to low cellular signal strength. Please move to a higher coverage area or steady Wi-Fi network and tap to retry.";
      } else {
        failText = `⚡ **Connection Failed**: It seems your connection was interrupted while calling your wellness coach. Message detail: ${err.message || "Network issue"}. Please check your internet connection and try again.`;
      }

      const errorMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        sender: 'assistant',
        text: failText,
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

      {/* Standalone Key Warning */}
      {!hasApiKey && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-start gap-2.5 text-[10px] text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-450 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Standalone Gemini Key Missing:</span>
            <p className="font-light text-[9px] text-slate-350 leading-normal">
              To support direct high-speed calculations, please open the <strong>Setup</strong> tab and provide a Gemini API Key.
            </p>
          </div>
        </div>
      )}



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
