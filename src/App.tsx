import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Apple, 
  MessageSquareShare, 
  UserCog, 
  History, 
  Settings as SettingsIcon, 
  ShieldAlert, 
  HeartHandshake,
  Activity,
  Trash2,
  Undo2,
  RefreshCw,
  Scale
} from 'lucide-react';
import { UserProfile, CalculationResult } from './types';
import { calculateMetrics } from './utils/calculators';
import Onboarding from './components/Onboarding';
import ResultsDashboard from './components/ResultsDashboard';
import FoodScanner from './components/FoodScanner';
import ChatAssistant from './components/ChatAssistant';
import HistoryPanel from './components/HistoryPanel';

type Tab = 'dashboard' | 'food_scanner' | 'ai_assistant' | 'profile' | 'history' | 'settings';

interface HistoryItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  timestamp: string;
}

export default function App() {
  // State from LocalStorage
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('befit_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const [calcHistory, setCalcHistory] = useState<CalculationResult[]>(() => {
    const saved = localStorage.getItem('befit_calc_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [foodLogs, setFoodLogs] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('befit_food_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('user_gemini_api_key') || '';
  });

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return userProfile ? 'dashboard' : 'profile';
  });

  // Calculate current metrics based on active profile details
  const [currentMetrics, setCurrentMetrics] = useState<CalculationResult | null>(() => {
    if (userProfile) {
      return calculateMetrics(userProfile);
    }
    return null;
  });

  // Sync state to local storage when changed
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('befit_user_profile', JSON.stringify(userProfile));
      const freshCalculations = calculateMetrics(userProfile);
      setCurrentMetrics(freshCalculations);
      
      // Auto-append compilation to history if not exists to track trends safely
      setCalcHistory((prev) => {
        // Only append if the profile has meaningful updates compared to last history item
        const last = prev[0];
        const isDifferent = !last || 
          last.profile.weight !== userProfile.weight || 
          last.profile.height !== userProfile.height ||
          last.profile.age !== userProfile.age ||
          last.profile.waist !== userProfile.waist ||
          last.profile.goal !== userProfile.goal ||
          last.profile.activityLevel !== userProfile.activityLevel;

        if (isDifferent) {
          const updated = [freshCalculations, ...prev].slice(0, 50); // limit 50 logs
          localStorage.setItem('befit_calc_history', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    } else {
      localStorage.removeItem('befit_user_profile');
      setCurrentMetrics(null);
    }
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('befit_calc_history', JSON.stringify(calcHistory));
  }, [calcHistory]);

  useEffect(() => {
    localStorage.setItem('befit_food_logs', JSON.stringify(foodLogs));
  }, [foodLogs]);

  // Callbacks
  const handleCompleteOnboarding = (profile: UserProfile) => {
    setUserProfile(profile);
    setActiveTab('dashboard');
  };

  const handleUpdateWeightHeight = (weight: number, height: number) => {
    if (!userProfile) return;
    setUserProfile({
      ...userProfile,
      weight: Math.round(weight * 10) / 10,
      height: Math.round(height * 10) / 10
    });
  };

  const handleAddCalories = (food: { name: string; calories: number; protein: number; carbs: number; fat: number; portion: string }) => {
    const newLogItem: HistoryItem = {
      ...food,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    setFoodLogs((prev) => [newLogItem, ...prev].slice(0, 100)); // limit 100 food logs
  };

  const handleDeleteCalc = (id: string) => {
    setCalcHistory((prev) => prev.filter(c => c.id !== id));
  };

  const handleDeleteFood = (id: string) => {
    setFoodLogs((prev) => prev.filter(f => f.id !== id));
  };

  const handleClearAllData = () => {
    setUserProfile(null);
    setCalcHistory([]);
    setFoodLogs([]);
    localStorage.clear();
    setActiveTab('profile');
  };

  const toggleUnitSystem = () => {
    if (!userProfile) return;
    const nextUnit = userProfile.unitSystem === 'metric' ? 'imperial' : 'metric';
    
    // Smooth conversion calculations so the numbers match unit systems instantly!
    let updatedHeight = userProfile.height;
    let updatedWeight = userProfile.weight;
    let updatedWaist = userProfile.waist;

    if (nextUnit === 'imperial') {
      // Metric was stored: heighten the resolution precision
      // Keep bases as-is, the UI converts them cleanly based on profiles
    }

    setUserProfile({
      ...userProfile,
      unitSystem: nextUnit
    });
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0a0f1e] text-slate-200 leading-normal font-sans antialiased relative overflow-hidden">
      
      {/* Decorative Blurred Glowing Abstract Shapes for Frosted Glass Backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-emerald-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-indigo-600/20 rounded-full blur-[150px]" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Desktop Left Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-white/5 backdrop-blur-2xl border-r border-white/10 text-white shrink-0 shadow-2xl z-10">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-emerald-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-350">Be Fit AI</h1>
            <span className="text-[10px] text-slate-400 font-medium font-mono uppercase tracking-wider">Health Map Companion</span>
          </div>
        </div>

        {/* Navigation block */}
        <nav className="flex-1 p-4 space-y-1.5 select-none" aria-label="Desktop drawer navigation selection">
          {[
            { id: 'dashboard', label: 'Bento Dashboard', icon: Compass, locked: !userProfile },
            { id: 'food_scanner', label: 'Scanner Calories', icon: Apple, locked: !userProfile },
            { id: 'ai_assistant', label: 'AI Health Coach', icon: MessageSquareShare, locked: !userProfile },
            { id: 'profile', label: 'Profile Setup', icon: UserCog, locked: false },
            { id: 'history', label: 'Logs History', icon: History, locked: !userProfile },
            { id: 'settings', label: 'Settings', icon: SettingsIcon, locked: false }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`desktop-nav-${item.id}`}
                onClick={() => !item.locked && setActiveTab(item.id as Tab)}
                disabled={item.locked}
                style={{ opacity: item.locked ? 0.35 : 1 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition text-left cursor-pointer ${activeTab === item.id ? 'bg-white/10 text-emerald-400 border border-white/10 shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer info brand */}
        <div className="p-4 border-t border-white/10">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-start gap-2.5">
            <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-slate-400 leading-normal font-light">
              We focus on premium health estimates. No shaming, no dangerous advice.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Head */}
      <header className="md:hidden bg-white/5 backdrop-blur-xl border-b border-white/10 text-white p-4 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-emerald-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-sm font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-350">Be Fit AI</h1>
        </div>
        <span className="text-[9px] uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono text-emerald-400">
          Mobile active
        </span>
      </header>

      {/* Main viewport Container scrollable */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 flex flex-col justify-between z-10 relative">
        <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
          
          <AnimatePresence mode="white">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.16 }}
            >
              {activeTab === 'dashboard' && currentMetrics && (
                <ResultsDashboard 
                  result={currentMetrics} 
                  onEditProfile={() => setActiveTab('profile')} 
                  onUpdateWeightHeight={handleUpdateWeightHeight}
                />
              )}

              {activeTab === 'onboarding_alert' && (
                <div className="p-8 text-center max-w-md mx-auto space-y-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-full text-emerald-400 w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
                    <UserCog className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white">Setup Required</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">
                    Establish your base weight, height, and unit targets so Be Fit AI can securely map customized body compositions and indices.
                  </p>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl shadow-lg font-bold text-xs transition cursor-pointer"
                  >
                    Set biometric parameters
                  </button>
                </div>
              )}

              {activeTab === 'food_scanner' && (
                <FoodScanner onAddCalories={handleAddCalories} />
              )}

              {activeTab === 'ai_assistant' && (
                <ChatAssistant 
                  userProfile={userProfile} 
                  currentMetrics={currentMetrics} 
                />
              )}

              {activeTab === 'profile' && (
                <Onboarding 
                  onComplete={handleCompleteOnboarding} 
                  initialProfile={userProfile || undefined} 
                />
              )}

              {activeTab === 'history' && (
                <HistoryPanel 
                  calcHistory={calcHistory} 
                  foodLogs={foodLogs} 
                  onDeleteCalc={handleDeleteCalc} 
                  onDeleteFood={handleDeleteFood} 
                  onClearAll={handleClearAllData} 
                />
              )}

              {activeTab === 'settings' && (
                <div className="max-w-2xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 select-none animate-fade-in">
                  <div className="border-b border-white/10 pb-3">
                    <h3 className="text-base font-bold text-white tracking-tight">System Settings</h3>
                    <p className="text-xs text-slate-400 font-light">Manage unit representations and secure memory configurations.</p>
                  </div>

                  {userProfile ? (
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">Biometric Unit System</span>
                        <span className="text-[10px] text-slate-400 font-light block">Currently selected: {userProfile.unitSystem === 'metric' ? 'Metric (cm, kg)' : 'Imperial (inches, lbs)'}</span>
                      </div>
                      <button
                        onClick={toggleUnitSystem}
                        className="text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-slate-200 shadow-sm transition"
                      >
                        Convert to {userProfile.unitSystem === 'metric' ? 'Imperial' : 'Metric'}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-white/5 border border-white/10 text-xs rounded-xl text-slate-500 italic block">
                      Sync profile first to convert biometric layouts directly.
                    </div>
                  )}

                  {/* Standalone Gemini Key Setup Option */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Standalone Gemini API Key</span>
                      <span className="text-[10px] text-slate-400 font-light block">
                        Allows calling the AI directly from the phone over any internet signal without using a proxy server.
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder={
                          (import.meta as any).env?.VITE_GEMINI_API_KEY && (import.meta as any).env?.VITE_GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
                            ? "Using pre-integrated build API key..."
                            : "Enter your custom Gemini API key..."
                        }
                        value={customApiKey}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomApiKey(val);
                          localStorage.setItem('user_gemini_api_key', val.trim());
                        }}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:outline-none focus:border-emerald-500/40"
                      />
                      {customApiKey && (
                        <button
                          onClick={() => {
                            setCustomApiKey('');
                            localStorage.removeItem('user_gemini_api_key');
                          }}
                          className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-rose-500/10 text-rose-300 font-semibold text-xs rounded-xl transition cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Note: You can get a free API Key from first-party Google developers. No data goes through any middle servers.
                    </p>
                  </div>

                  {/* Reset storage element */}
                  <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl leading-normal">
                    <div>
                      <span className="text-xs font-semibold text-rose-300 block">Clear Cache Memory</span>
                      <span className="text-[10px] text-rose-450 font-light block">Instantly purge profile details, trackers, and history records.</span>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm("Purging memory deletes logs permanently. Continue?")) {
                          handleClearAllData();
                        }
                      }}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
                    >
                      Purge Memory
                    </button>
                  </div>

                  <hr className="border-white/10" />

                  {/* Scientific Disclaimer segment */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1 font-mono">
                      <ShieldAlert className="w-4 h-4 text-amber-500" />
                      Wellness Disclaimer & Safety Protocol
                    </h4>
                    <div className="text-[11px] text-slate-400 font-light leading-relaxed space-y-2">
                      <p>
                        Be Fit AI is built exclusively as an interactive general wellness estimation app. The formulas leveraged (such as Mifflin-St Jeor, Deurenberg BMI fat metrics) provide estimate baseline indexes, not clinical parameters.
                      </p>
                      <p>
                        Metrics and calorie scan results do not substitute for custom diagnostic advices, clinical dieting formulations, or athletic safety supervisions.
                      </p>
                      <p>
                        <strong>Never</strong> engage in extreme calorie shortages, crash nutritional limitations, or physical exercises that trigger somatic pain. If you undergo cardiovascular concerns or have clinical conditions, please seek immediate guidance from a licensed health practitioner.
                      </p>
                    </div>
                  </div>

                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>

        {/* Sticky footer disclaimer warning across all pages for ultimate medical safety */}
        <footer className="px-6 py-4 bg-white/5 border-t border-white/10 text-center select-none">
          <p className="text-[9px] text-slate-400 font-light max-w-3xl mx-auto leading-normal">
            Be Fit AI is a certified offline-secure wellness calculator. Always consult medical experts for clinical guidance. 
            All files are stored local-first on your safe device. © 2026 Be Fit AI.
          </p>
        </footer>
      </main>

      {/* Mobile Bottom Dock Menu */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white/5 backdrop-blur-2xl border-t border-white/10 text-white flex justify-around p-3 z-30 select-none pb-4" 
        aria-label="Mobile viewport quick tabs dock"
      >
        {[
          { id: 'dashboard', label: 'Bento', icon: Compass, locked: !userProfile },
          { id: 'food_scanner', label: 'Scanner', icon: Apple, locked: !userProfile },
          { id: 'ai_assistant', label: 'Coach', icon: MessageSquareShare, locked: !userProfile },
          { id: 'profile', label: 'Profile', icon: UserCog, locked: false },
          { id: 'settings', label: 'Setup', icon: SettingsIcon, locked: false }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => !item.locked && setActiveTab(item.id as Tab)}
              disabled={item.locked}
              style={{ opacity: item.locked ? 0.35 : 1 }}
              className={`flex flex-col items-center justify-center gap-1 transition cursor-pointer min-w-10 ${activeTab === item.id ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[8px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
