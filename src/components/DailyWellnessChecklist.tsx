import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplet, 
  Moon, 
  Flame, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Sparkles, 
  Trophy, 
  RotateCcw,
  Calendar,
  AlertCircle,
  Info,
  Bell,
  BellRing,
  Clock,
  Volume2
} from 'lucide-react';
import WellnessChart from './WellnessChart';
import WellnessCalendarHeatmap from './WellnessCalendarHeatmap';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

interface WellnessData {
  hydration: number; // Glasses of water
  sleep: number;      // Hours
  activeMinutes: number; // Minutes
  hydrationChecked: boolean;
  sleepChecked: boolean;
  activeChecked: boolean;
}

const WATER_GOAL = 8;       // 8 glasses
const SLEEP_GOAL = 8.0;     // 8 hours
const ACTIVE_GOAL = 30;     // 30 minutes

export default function DailyWellnessChecklist() {
  const [todayStr, setTodayStr] = useState('');
  const [data, setData] = useState<WellnessData>({
    hydration: 0,
    sleep: 0,
    activeMinutes: 0,
    hydrationChecked: false,
    sleepChecked: false,
    activeChecked: false
  });
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hydration reminders scheduler states
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderInterval, setReminderInterval] = useState<'auto' | '30' | '60' | '120' | '180'>('auto');
  const [remindersStartTime, setRemindersStartTime] = useState('08:00');
  const [remindersEndTime, setRemindersEndTime] = useState('22:00');
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [activeToasts, setActiveToasts] = useState<Array<{ id: string; title: string; desc: string; icon: string }>>([]);

  // Initialize date, fetch data from localStorage
  useEffect(() => {
    // Format date as local date string to avoid timezone shifts
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${dateKeyHelper() ? dateKeyHelper() : day}`; // safe fallback helper
    
    function dateKeyHelper() {
      return day;
    }

    setTodayStr(dateKey);

    const saved = localStorage.getItem(`wellness_checklist_${dateKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(prev => ({
          ...prev,
          ...parsed
        }));
      } catch (e) {
        console.error('Failed to parse daily wellness checklist state', e);
      }
    }

    const savedCompleted = localStorage.getItem('wellness_completed_days_history');
    if (savedCompleted) {
      try {
        const parsedCompleted = JSON.parse(savedCompleted);
        console.log('[DEBUG DailyWellnessChecklist initialization] Loaded completedDays history:', parsedCompleted);
        setCompletedDays(parsedCompleted);
      } catch (e) {
        console.error('Failed to parse completed days history', e);
      }
    }

    // Load reminder configurations
    const savedRemindersEnabled = localStorage.getItem('wellness_hydration_reminders_enabled');
    if (savedRemindersEnabled) {
      setRemindersEnabled(savedRemindersEnabled === 'true');
    }
    const savedReminderInterval = localStorage.getItem('wellness_hydration_reminder_interval');
    if (savedReminderInterval) {
      setReminderInterval(savedReminderInterval as any);
    }
    const savedStartTime = localStorage.getItem('wellness_hydration_reminders_start_time');
    if (savedStartTime) {
      setRemindersStartTime(savedStartTime);
    }
    const savedEndTime = localStorage.getItem('wellness_hydration_reminders_end_time');
    if (savedEndTime) {
      setRemindersEndTime(savedEndTime);
    }
    
    // Check initial notification support & status
    if (!('Notification' in window)) {
      setPermissionStatus('unsupported');
    } else {
      setPermissionStatus(Notification.permission);
    }

    // Register PWA Service Worker to support background lockscreen notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[Service Worker] Hydration reminders system loaded successfully:', reg);
        })
        .catch((err) => {
          console.warn('[Service Worker] Registration declined or failed:', err);
        });
    }
    
    setIsInitialized(true);
  }, []);

  // Listen for background quick-log water clicks sent from system notifications
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'QUICK_LOG_WATER_GLASS') {
        setData(prev => {
          const nextVal = prev.hydration + 1;
          return {
            ...prev,
            hydration: nextVal,
            hydrationChecked: nextVal >= WATER_GOAL ? true : prev.hydrationChecked
          };
        });
        addToast(
          "💧 Water Logged!",
          "Successfully logged 1 glass directly from lockscreen notification action badge.",
          "success"
        );
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [isInitialized]);

  // Sync data to localStorage on changes
  useEffect(() => {
    if (!todayStr || !isInitialized) return;
    localStorage.setItem(`wellness_checklist_${todayStr}`, JSON.stringify(data));

    // Check if everything is checked and at least goals are close or completed to trigger celebration
    const allCompleted = 
      (data.hydration >= WATER_GOAL || data.hydrationChecked) &&
      (data.sleep >= SLEEP_GOAL || data.sleepChecked) &&
      (data.activeMinutes >= ACTIVE_GOAL || data.activeChecked);

    const isTodayCompleted = allCompleted && (data.hydration > 0 || data.sleep > 0 || data.activeMinutes > 0);

    if (isTodayCompleted) {
      setShowCelebrate(true);
    } else {
      setShowCelebrate(false);
    }

    // Safely update history log
    const savedCompleted = localStorage.getItem('wellness_completed_days_history');
    let history: string[] = [];
    if (savedCompleted) {
      try {
        history = JSON.parse(savedCompleted);
      } catch (e) {
        history = [];
      }
    }
    
    const exists = history.includes(todayStr);
    let updated = false;
    let nextHistory = [...history];

    console.log('[DEBUG DailyWellnessChecklist Sync] todayStr:', todayStr, 'isTodayCompleted:', isTodayCompleted, 'exists:', exists, 'history array before sync:', history);

    if (isTodayCompleted && !exists) {
      nextHistory.push(todayStr);
      updated = true;
      console.log('[DEBUG DailyWellnessChecklist Sync] Added today to history. updated nextHistory:', nextHistory);
    } else if (!isTodayCompleted && exists) {
      nextHistory = history.filter(d => d !== todayStr);
      updated = true;
      console.log('[DEBUG DailyWellnessChecklist Sync] Removed today from history. updated nextHistory:', nextHistory);
    }

    if (updated) {
      localStorage.setItem('wellness_completed_days_history', JSON.stringify(nextHistory));
      setCompletedDays(nextHistory);
    } else if (completedDays.length === 0 && history.length > 0) {
      setCompletedDays(history);
    }
  }, [data, todayStr, isInitialized]);

  // Save reminder settings when changed
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem('wellness_hydration_reminders_enabled', String(remindersEnabled));
    localStorage.setItem('wellness_hydration_reminder_interval', reminderInterval);
    localStorage.setItem('wellness_hydration_reminders_start_time', remindersStartTime);
    localStorage.setItem('wellness_hydration_reminders_end_time', remindersEndTime);
  }, [remindersEnabled, reminderInterval, remindersStartTime, remindersEndTime, isInitialized]);

  // Sync scheduled background alarms (both PWA Triggers and Capacitor Native Tasks)
  const syncBackgroundAlarms = async () => {
    if (!isInitialized) return;

    // 1. Native Mobile Platform (Capacitor) Background Alarms with lockscreen vibration support
    if (Capacitor.isNativePlatform()) {
      try {
        const hasPermission = await LocalNotifications.checkPermissions();
        if (hasPermission.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }

        // Cancel previous native schedule to prevent overlaps
        const pending = await LocalNotifications.getPending();
        if (pending.notifications && pending.notifications.length > 0) {
          await LocalNotifications.cancel({ notifications: pending.notifications });
        }

        if (!remindersEnabled || data.hydration >= WATER_GOAL) {
          console.log('[DEBUG-Capacitor] Native local reminders cleared/disabled.');
          return;
        }

        // Setup vibrating notification channel (essential for Android lockscreen vibration priority)
        await LocalNotifications.createChannel({
          id: 'hydration-vibrate-alarms',
          name: 'Vibrating Hydration Reminders',
          description: 'High-importance vibrating alerts to drink water even with phone locked',
          importance: 5, // Top priority to ensure immediate popups & vibration on lockscreen
          visibility: 1, // Public visibility on lockscreen
          vibration: true,
          sound: 'default'
        });

        // Compute interval in minutes
        let intervalMin = 60;
        if (reminderInterval === 'auto') {
          const startParts = remindersStartTime.split(':').map(Number);
          const endParts = remindersEndTime.split(':').map(Number);
          const startMin = startParts[0] * 60 + startParts[1];
          const endMin = endParts[0] * 60 + endParts[1];
          const wakeMin = Math.max(180, endMin - startMin); 
          intervalMin = Math.max(15, Math.round(wakeMin / WATER_GOAL));
        } else {
          intervalMin = Number(reminderInterval);
        }

        const now = new Date();
        const [startH, startM] = remindersStartTime.split(':').map(Number);
        
        const activeTimes: Date[] = [];
        const maxNativeNotifications = 8;
        let nextSchTime = new Date(now);

        const lastSentStr = localStorage.getItem('wellness_last_hydration_reminder_stamp');
        if (lastSentStr) {
          const lastSentDate = new Date(lastSentStr);
          nextSchTime = new Date(lastSentDate.getTime() + intervalMin * 60 * 1000);
        } else {
          nextSchTime = new Date(now.getTime() + intervalMin * 60 * 1000);
        }

        if (nextSchTime.getTime() <= now.getTime()) {
          nextSchTime = new Date(now.getTime() + intervalMin * 60 * 1000);
        }

        for (let i = 0; i < maxNativeNotifications; i++) {
          const currentSchTimeStr = nextSchTime.toTimeString().slice(0, 5);
          
          if (currentSchTimeStr > remindersEndTime) {
            nextSchTime.setDate(nextSchTime.getDate() + 1);
            nextSchTime.setHours(startH, startM, 0, 0);
          } else if (currentSchTimeStr < remindersStartTime) {
            nextSchTime.setHours(startH, startM, 0, 0);
          }

          activeTimes.push(new Date(nextSchTime));
          nextSchTime = new Date(nextSchTime.getTime() + intervalMin * 60 * 1000);
        }

        const nativeNotificationsToSchedule = activeTimes.map((runTime, idx) => {
          return {
            title: `💧 Hydration Tracker Alarm`,
            body: `Drink Water! (Currently ${data.hydration}/${WATER_GOAL} glasses logged today). Stay fueled.`,
            id: 2000 + idx,
            schedule: { at: runTime },
            channelId: 'hydration-vibrate-alarms',
            smallIcon: 'ic_stat_name',
            iconColor: '#2563eb',
            attachments: [],
            extra: null
          };
        });

        await LocalNotifications.schedule({
          notifications: nativeNotificationsToSchedule
        });
        console.log('[DEBUG-Capacitor] Scheduled native local notifications:', nativeNotificationsToSchedule);
      } catch (err) {
        console.error('[Capacitor] Native local notifications scheduling failed:', err);
      }
    }

    // 2. Web/PWA-based Alarms using Service Worker registration with custom Vibration patterns
    if ('serviceWorker' in navigator && 'Notification' in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        
        // Clear previous notifications of this type
        if ('getNotifications' in reg) {
          const activeNotifications = await reg.getNotifications();
          activeNotifications.forEach((notification: any) => {
            if (notification.tag && (notification.tag.startsWith('wellness-hydrate-') || notification.tag === 'wellness-hydrate')) {
              notification.close();
            }
          });
        }

        if (!remindersEnabled || data.hydration >= WATER_GOAL || Notification.permission !== 'granted') {
          console.log('[DEBUG-PWA] Web background alarms not scheduled/cleared.');
          return;
        }

        // Compute interval in minutes
        let intervalMin = 60;
        if (reminderInterval === 'auto') {
          const startParts = remindersStartTime.split(':').map(Number);
          const endParts = remindersEndTime.split(':').map(Number);
          const startMin = startParts[0] * 60 + startParts[1];
          const endMin = endParts[0] * 60 + endParts[1];
          const wakeMin = Math.max(180, endMin - startMin); 
          intervalMin = Math.max(15, Math.round(wakeMin / WATER_GOAL));
        } else {
          intervalMin = Number(reminderInterval);
        }

        const now = new Date();
        const [startH, startM] = remindersStartTime.split(':').map(Number);
        
        const activeTimes: Date[] = [];
        const maxWebNotifications = 8;
        let nextSchTime = new Date(now);

        const lastSentStr = localStorage.getItem('wellness_last_hydration_reminder_stamp');
        if (lastSentStr) {
          const lastSentDate = new Date(lastSentStr);
          nextSchTime = new Date(lastSentDate.getTime() + intervalMin * 60 * 1000);
        } else {
          nextSchTime = new Date(now.getTime() + intervalMin * 60 * 1000);
        }

        if (nextSchTime.getTime() <= now.getTime()) {
          nextSchTime = new Date(now.getTime() + intervalMin * 60 * 1000);
        }

        for (let i = 0; i < maxWebNotifications; i++) {
          const currentSchTimeStr = nextSchTime.toTimeString().slice(0, 5);
          
          if (currentSchTimeStr > remindersEndTime) {
            nextSchTime.setDate(nextSchTime.getDate() + 1);
            nextSchTime.setHours(startH, startM, 0, 0);
          } else if (currentSchTimeStr < remindersStartTime) {
            nextSchTime.setHours(startH, startM, 0, 0);
          }

          activeTimes.push(new Date(nextSchTime));
          nextSchTime = new Date(nextSchTime.getTime() + intervalMin * 60 * 1000);
        }

        const isTriggerSupported = 'showTrigger' in Notification.prototype || (window as any).TimestampTrigger;

        for (let i = 0; i < activeTimes.length; i++) {
          const runTime = activeTimes[i];
          const title = "💧 Hydration Alarm Reminder";
          const desc = `Time to hydrate! Standard Target Check: ${data.hydration}/${WATER_GOAL} glasses logged today. Click or tap to quickly record 1 glass.`;

          const notificationOptions: any = {
            body: desc,
            icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
            badge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
            tag: `wellness-hydrate-${i}`,
            renotify: true,
            // Long, robust vibration cadence specifically designed to wake device hardware and rattle lockscreen/pockets distinctly!
            // Cadence: 800ms vibration, 200ms rest, repeated 4 times.
            vibrate: [800, 200, 800, 200, 800, 200, 800],
            actions: [
              { action: 'log-water', title: '💧 Drink 1 Glass' },
              { action: 'close', title: 'Dismiss' }
            ],
            requireInteraction: true
          };

          if (isTriggerSupported) {
            notificationOptions.showTrigger = new (window as any).TimestampTrigger(runTime.getTime());
            await reg.showNotification(title, notificationOptions);
          } else {
            // Standard fallback when the experimental Notification Triggers API is missing in the browser environment.
            // When foregrounded, our React interval will wake up and display these immediately as backup.
            if (i === 0 && runTime.getTime() - now.getTime() < 60000) {
              await reg.showNotification(title, notificationOptions);
            }
          }
        }
        console.log('[DEBUG-PWA] Scheduled web local trigger notifications:', activeTimes);
      } catch (err) {
        console.error('[PWA] Web trigger notifications scheduling failed:', err);
      }
    }
  };

  // Re-sync background native and PWA alarms on schedule, target or settings update
  useEffect(() => {
    if (!isInitialized) return;
    syncBackgroundAlarms();
  }, [remindersEnabled, reminderInterval, remindersStartTime, remindersEndTime, data.hydration, isInitialized]);

  // Request notification permissions
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setPermissionStatus('unsupported');
      addToast(
        "Notifications unsupported", 
        "Your browser environment does not support HTML5 API. In-app toast chimers will be used as helpful fallback!", 
        "warning"
      );
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === 'granted') {
        addToast(
          "Notifications Enabled!", 
          "System push notification alerts successfully configured based on your daily hydration targets.",
          "success"
        );
        
        // Show rich system notification via SW registration for lock screen Support
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification("💧 Hydration reminders active!", {
              body: `We will remind you periodically to complete your daily goal of ${WATER_GOAL} glasses of water.`,
              icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
              badge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
              tag: 'wellness-active',
              vibrate: [800, 200, 800, 200, 800, 200, 800],
              actions: [
                { action: 'log-water', title: '💧 Drink 1 Glass' },
                { action: 'close', title: 'Dismiss' }
              ]
            } as any);
          }).catch(() => {
            new Notification("💧 Hydration reminders active!", {
              body: `We will remind you periodically to complete your daily goal of ${WATER_GOAL} glasses of water.`,
              icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233b82f6"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
              tag: 'wellness-active'
            });
          });
        } else {
          new Notification("💧 Hydration reminders active!", {
            body: `We will remind you periodically to complete your daily goal of ${WATER_GOAL} glasses of water.`,
            icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233b82f6"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
            tag: 'wellness-active'
          });
        }
      } else if (permission === 'denied') {
        addToast(
          "Push Alerts Blocked", 
          "Permissions denied. Active in-app audio chime reminders will alert you instead!", 
          "warning"
        );
      }
    } catch (err) {
      console.error("Failed requesting notification permissions", err);
    }
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      
      osc.type = 'sine';
      const now = audioCtx.currentTime;
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      // Friendly, light ambient C5 -> E5 -> G5 water drop cascade chime
      osc.frequency.setValueAtTime(523.25, now); 
      osc.frequency.setValueAtTime(659.25, now + 0.12); 
      osc.frequency.setValueAtTime(783.99, now + 0.24); 
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (error) {
      console.error("Audio chime failed to play", error);
    }
  };

  const addToast = (title: string, desc: string, iconType: string = 'hydration') => {
    const id = Math.random().toString(36).substring(2, 9);
    setActiveToasts(prev => [...prev, { id, title, desc, icon: iconType }]);
    playChime();
    
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  };

  const getWakeTimeSpan = () => {
    try {
      const startParts = remindersStartTime.split(':').map(Number);
      const endParts = remindersEndTime.split(':').map(Number);
      const startMin = startParts[0] * 60 + startParts[1];
      const endMin = endParts[0] * 60 + endParts[1];
      const wakeHrs = (endMin - startMin) / 60;
      return wakeHrs > 0 ? wakeHrs : 14; 
    } catch (e) {
      return 14;
    }
  };

  const triggerNotification = (intervalMin: number) => {
    localStorage.setItem('wellness_last_hydration_reminder_stamp', new Date().toISOString());
    
    const title = "💧 Hydration Reminder";
    const desc = `You've drunk ${data.hydration}/${WATER_GOAL} glasses today. Next glass is recommended now to meet your daily goal of ${WATER_GOAL} glasses!`;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body: desc,
              icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
              badge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
              tag: 'wellness-hydrate',
              vibrate: [800, 200, 800, 200, 800, 200, 800],
              renotify: true,
              actions: [
                { action: 'log-water', title: '💧 Drink 1 Glass' },
                { action: 'close', title: 'Dismiss' }
              ]
            } as any);
          }).catch(() => {
            new Notification(title, {
              body: desc,
              icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233b82f6"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
              tag: 'wellness-hydrate',
              requireInteraction: false
            });
          });
        } else {
          new Notification(title, {
            body: desc,
            icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233b82f6"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
            tag: 'wellness-hydrate',
            requireInteraction: false
          });
        }
      } catch (err) {
        console.error("Failed to construct Notification", err);
      }
    }
    
    addToast(title, desc, 'hydration');
  };

  const triggerTestNotification = () => {
    addToast(
      "💧 Test Alarm Activated!", 
      `Reminders are active based on your goal of ${WATER_GOAL} glasses. Drink up!`,
      "hydration"
    );
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification("💧 Hydration reminder", {
              body: `Keep up your streak! Satisfy your daily goal of ${WATER_GOAL} glasses of water.`,
              icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
              badge: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%232563eb"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
              tag: 'test',
              vibrate: [800, 200, 800, 200, 800, 200, 800],
              actions: [
                { action: 'log-water', title: '💧 Drink 1 Glass' },
                { action: 'close', title: 'Dismiss' }
              ]
            } as any);
          }).catch(() => {
            new Notification("💧 Hydration reminder", {
              body: `Keep up your streak! Satisfy your daily goal of ${WATER_GOAL} glasses of water.`,
              tag: 'test'
            });
          });
        } else {
          new Notification("💧 Hydration reminder", {
            body: `Keep up your streak! Satisfy your daily goal of ${WATER_GOAL} glasses of water.`,
            tag: 'test'
          });
        }
      } catch (err) {
        console.error("Test notification failed", err);
      }
    }
  };

  // Timer setup for checking active schedules
  useEffect(() => {
    if (!remindersEnabled) return;
    
    const checkReminderTime = () => {
      const now = new Date();
      const currentHourStr = now.toTimeString().slice(0, 5); 
      
      if (currentHourStr < remindersStartTime || currentHourStr > remindersEndTime) {
        return; 
      }
      
      let intervalMin = 60;
      if (reminderInterval === 'auto') {
        const startParts = remindersStartTime.split(':').map(Number);
        const endParts = remindersEndTime.split(':').map(Number);
        const startMin = startParts[0] * 60 + startParts[1];
        const endMin = endParts[0] * 60 + endParts[1];
        const wakeMin = Math.max(180, endMin - startMin); 
        intervalMin = Math.max(15, Math.round(wakeMin / WATER_GOAL));
      } else {
        intervalMin = Number(reminderInterval);
      }
      
      const lastSentStr = localStorage.getItem('wellness_last_hydration_reminder_stamp');
      let shouldSend = false;
      if (!lastSentStr) {
        shouldSend = true;
      } else {
        const lastSentDate = new Date(lastSentStr);
        const diffMs = now.getTime() - lastSentDate.getTime();
        const diffMin = diffMs / (1000 * 60);
        if (diffMin >= intervalMin) {
          shouldSend = true;
        }
      }
      
      if (shouldSend) {
        triggerNotification(intervalMin);
      }
    };
    
    checkReminderTime();
    const intervalId = setInterval(checkReminderTime, 30000); // Check every 30 seconds
    return () => clearInterval(intervalId);
  }, [remindersEnabled, reminderInterval, remindersStartTime, remindersEndTime, data.hydration]);

  const updateField = <K extends keyof WellnessData>(field: K, value: WellnessData[K]) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Custom toggle handlers: ticking/checking sets target fully completed automatically, unchecking resets progress bar to 0
  const toggleHydration = () => {
    setData(prev => {
      const nextChecked = !prev.hydrationChecked;
      return {
        ...prev,
        hydrationChecked: nextChecked,
        hydration: nextChecked ? WATER_GOAL : 0
      };
    });
  };

  const toggleSleep = () => {
    setData(prev => {
      const nextChecked = !prev.sleepChecked;
      return {
        ...prev,
        sleepChecked: nextChecked,
        sleep: nextChecked ? SLEEP_GOAL : 0
      };
    });
  };

  const toggleActive = () => {
    setData(prev => {
      const nextChecked = !prev.activeChecked;
      return {
        ...prev,
        activeChecked: nextChecked,
        activeMinutes: nextChecked ? ACTIVE_GOAL : 0
      };
    });
  };

  const incrementHydration = () => {
    const nextVal = Math.min(48, data.hydration + 1);
    setData(prev => ({
      ...prev,
      hydration: nextVal,
      // Auto-toggle check if target reached
      hydrationChecked: nextVal >= WATER_GOAL ? true : prev.hydrationChecked
    }));
  };

  const decrementHydration = () => {
    const nextVal = Math.max(0, data.hydration - 1);
    setData(prev => ({
      ...prev,
      hydration: nextVal,
      hydrationChecked: nextVal < WATER_GOAL ? false : prev.hydrationChecked
    }));
  };

  const incrementSleep = () => {
    const nextVal = Math.min(24, data.sleep + 0.5);
    setData(prev => ({
      ...prev,
      sleep: nextVal,
      sleepChecked: nextVal >= SLEEP_GOAL ? true : prev.sleepChecked
    }));
  };

  const decrementSleep = () => {
    const nextVal = Math.max(0, data.sleep - 0.5);
    setData(prev => ({
      ...prev,
      sleep: nextVal,
      sleepChecked: nextVal < SLEEP_GOAL ? false : prev.sleepChecked
    }));
  };

  const incrementActive = () => {
    const nextVal = Math.min(1440, data.activeMinutes + 5);
    setData(prev => ({
      ...prev,
      activeMinutes: nextVal,
      activeChecked: nextVal >= ACTIVE_GOAL ? true : prev.activeChecked
    }));
  };

  const decrementActive = () => {
    const nextVal = Math.max(0, data.activeMinutes - 5);
    setData(prev => ({
      ...prev,
      activeMinutes: nextVal,
      activeChecked: nextVal < ACTIVE_GOAL ? false : prev.activeChecked
    }));
  };

  const resetToday = () => {
    if (window.confirm("Do you want to reset today's tracked wellness checklist data?")) {
      setData({
        hydration: 0,
        sleep: 0,
        activeMinutes: 0,
        hydrationChecked: false,
        sleepChecked: false,
        activeChecked: false
      });
      setSubmitMessage(null);
    }
  };

  const handleSubmitChecklist = () => {
    const isWaterUnder = data.hydration < WATER_GOAL;
    const isSleepUnder = data.sleep < SLEEP_GOAL;
    const isActiveUnder = data.activeMinutes < ACTIVE_GOAL;

    if (isWaterUnder || isSleepUnder || isActiveUnder) {
      setSubmitMessage("No worries You can complete it tomorrow also 🥰");
    } else {
      setSubmitMessage("Excellent progress! You have completed all your wellness goals today! 🌟");
    }
  };

  // Compute stats
  const completedCount = 
    (data.hydrationChecked ? 1 : 0) + 
    (data.sleepChecked ? 1 : 0) + 
    (data.activeChecked ? 1 : 0);

  const completionPercent = Math.round((completedCount / 3) * 100);

  // Compute consecutive streak count accurately
  const getStreak = () => {
    console.log('[DEBUG getStreak] Starting calculation. completedDays:', completedDays);
    if (completedDays.length === 0) {
      console.log('[DEBUG getStreak] completedDays is empty, returning streak 0');
      return 0;
    }
    
    // Use Set for fast contains check
    const completedSet = new Set(completedDays);
    const today = new Date();
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const todayStrVal = formatDate(today);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStrVal = formatDate(yesterday);
    
    console.log('[DEBUG getStreak] todayStrVal:', todayStrVal, 'yesterdayStrVal:', yesterdayStrVal, 'completedSet:', Array.from(completedSet));
    
    // Determine the start date of the streak
    let currentCheck = today;
    if (completedSet.has(todayStrVal)) {
      console.log('[DEBUG getStreak] Streak starts from today:', todayStrVal);
      currentCheck = today;
    } else if (completedSet.has(yesterdayStrVal)) {
      console.log('[DEBUG getStreak] Streak starts from yesterday:', yesterdayStrVal);
      currentCheck = yesterday;
    } else {
      console.log('[DEBUG getStreak] Streak is broken because neither today nor yesterday is completed. Streak: 0');
      return 0;
    }
    
    let streakCount = 0;
    while (true) {
      const formatted = formatDate(currentCheck);
      const isCompleted = completedSet.has(formatted);
      console.log('[DEBUG getStreak] Checking offset date:', formatted, 'isCompleted:', isCompleted);
      if (isCompleted) {
        streakCount++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        console.log('[DEBUG getStreak] Streak broke at:', formatted, 'Final computed streakCount:', streakCount);
        break;
      }
    }
    return streakCount;
  };

  const streak = getStreak();

  // Multi-day calendar logs for the past week
  const getWeeklyStatus = () => {
    const statusList = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dateVal}`;
      
      const isToday = i === 0;
      const label = d.toLocaleDateString(undefined, { weekday: 'narrow' }); // 'M', 'T', 'W'...
      const completed = completedDays.includes(dateStr);
      statusList.push({ dateStr, label, completed, isToday });
    }
    return statusList;
  };

  const getReadableToday = () => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div id="daily-wellness-checklist-container" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl relative overflow-hidden text-left">
      
      {/* Dynamic celebratory ambient glow overlay */}
      {showCelebrate && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 pointer-events-none animate-pulse" />
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase">
              Daily Habit Tracker
            </div>
            <span className="text-xs text-slate-550">•</span>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-slate-350">{getReadableToday()}</span>
            </div>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            Wellness Checklist
            {showCelebrate && <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce" />}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Streak Badge to drive extreme engagement */}
          <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 transition-all ${
            streak > 0 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-500 fill-amber-500 animate-bounce' : 'text-slate-500'}`} />
            <div className="text-left leading-none">
              <span className="text-[9px] opacity-75 font-mono block uppercase">Habit Streak</span>
              <span className="text-xs font-black font-mono">{streak} {streak === 1 ? 'Day' : 'Days'}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono uppercase block">Daily Progress</span>
            <span className="text-sm font-extrabold font-mono text-emerald-400">{completionPercent}% Complete</span>
          </div>

          <button
            onClick={resetToday}
            title="Reset data"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Global Progress Bar */}
      <div className="my-4 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden relative border border-white/[0.02]">
        <motion.div
          id="wellness-progressbar-fill"
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
          initial={{ width: 0 }}
          animate={{ width: `${completionPercent}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Weekly History Dots Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-3 my-4">
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Weekly Habits Log</span>
          <span className="text-[9px] text-slate-400 font-light max-w-xs leading-normal mt-0.5">Finish all targets to stamp a checkmark! Keep your flame alive.</span>
        </div>
        <div className="flex gap-2.5">
          {getWeeklyStatus().map((dayOpt, idx) => {
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center gap-1.5"
                title={`${dayOpt.dateStr}: ${dayOpt.completed ? 'Completed' : 'Not completed'}`}
              >
                <span className={`text-[9px] font-mono font-bold ${dayOpt.isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {dayOpt.label}
                </span>
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black font-mono transition-all border ${
                    dayOpt.completed 
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)] font-bold' 
                      : dayOpt.isToday 
                        ? 'border-emerald-500/40 bg-zinc-950/20 text-slate-500 animate-pulse' 
                        : 'border-white/10 bg-transparent text-slate-600'
                  }`}
                >
                  {dayOpt.completed ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-day habits analytics chart */}
      <WellnessChart 
        completedDays={completedDays} 
        currentData={data} 
        todayStr={todayStr} 
      />

      {/* Monthly Heatmap & Streak Calendar Visualization */}
      <WellnessCalendarHeatmap
        completedDays={completedDays}
        currentData={data}
        todayStr={todayStr}
      />

      {/* Important instructions note */}
      <div className="bg-blue-500/10 border border-blue-500/20 text-slate-300 rounded-2xl p-4 text-xs leading-relaxed flex items-start gap-3 my-2 font-sans">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-left">
          <p className="font-bold text-slate-100 font-mono text-[10px] uppercase tracking-wider text-blue-400">Important Note</p>
          <p className="text-slate-300 text-[11px] leading-normal">
            If you have completed your goal completely, tick the checkbox next to the goal. Otherwise, simply adjust your progress with the <span className="font-mono text-[10px] bg-white/5 px-1 py-0.5 rounded text-slate-200 font-semibold">+</span> / <span className="font-mono text-[10px] bg-white/5 px-1 py-0.5 rounded text-slate-200 font-semibold">-</span> buttons without checking the box. At the end of goals, click the <strong className="text-emerald-400 font-bold">"Submit Checklist"</strong> button!
          </p>
        </div>
      </div>

      {/* Checklist items layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        
        {/* Unit 1: Hydration Tracker */}
        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between transition relative overflow-hidden bg-white/5 ${data.hydrationChecked ? 'border-emerald-500/25 bg-emerald-500/[0.02]' : 'border-white/5 hover:bg-white/[0.07]'}`}>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${data.hydrationChecked ? 'bg-emerald-400/20 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                <Droplet className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Hydration target</h4>
                <p className="text-[9px] text-slate-400 font-mono">Goal: {WATER_GOAL} glasses</p>
              </div>
            </div>

            <button
              id="chk-hydration"
              onClick={toggleHydration}
              className={`p-1 rounded cursor-pointer transition border ${data.hydrationChecked ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-transparent border-white/20 hover:border-slate-400 text-transparent'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 fill-current text-current" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black font-mono text-white">
                {data.hydration} <span className="text-xs font-normal opacity-50">glasses</span>
              </span>
              <span className="text-[9px] text-slate-450 font-mono">
                {data.hydration >= WATER_GOAL ? 'Goal Surpassed! 🎉' : `${Math.max(0, WATER_GOAL - data.hydration)} left`}
              </span>
            </div>

            {/* Quick action buttons & water glass segments indicators */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={decrementHydration}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-2 text-[10px] font-mono font-bold text-slate-400">Ctrl</span>
                <button
                  type="button"
                  onClick={incrementHydration}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Mini relative progress bar */}
              <div className="flex-1 flex gap-0.5 h-2.5 items-center justify-start overflow-hidden px-1">
                {Array.from({ length: Math.max(WATER_GOAL, data.hydration) }).map((_, i) => (
                  <div 
                     key={i}
                    className={`h-full w-1 rounded-sm transition ${i < data.hydration ? 'bg-blue-400' : 'bg-white/10'}`}
                  />
                ))}
              </div>
            </div>

            {/* Reminders Toggle & Expandable Settings */}
            <div className="mt-3.5 pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowReminderSettings(!showReminderSettings)}
                  className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200 transition font-mono uppercase tracking-wider cursor-pointer"
                >
                  <Bell className={`w-3.5 h-3.5 ${remindersEnabled ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
                  <span>Hydration Alarms</span>
                  <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded font-bold text-slate-300 font-mono">
                    {remindersEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">Remind Me</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!remindersEnabled) {
                        setRemindersEnabled(true);
                        if ('Notification' in window && Notification.permission === 'default') {
                          requestNotificationPermission();
                        } else if (permissionStatus === 'unsupported' || permissionStatus === 'denied') {
                          addToast("Reminders Active", "In-app audio alarms are ready to notify you.", "success");
                        }
                      } else {
                        setRemindersEnabled(false);
                      }
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      remindersEnabled ? 'bg-blue-500' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        remindersEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Expandable Settings Layout */}
              <AnimatePresence>
                {showReminderSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-3 pt-2 text-[11px] text-slate-350"
                  >
                    {/* Permission trigger banner if not granted */}
                    {permissionStatus === 'default' && (
                      <button
                        type="button"
                        onClick={requestNotificationPermission}
                        className="w-full p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-300 text-[10px] font-mono font-bold uppercase transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <BellRing className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                        Enable Browser Push Alerts
                      </button>
                    )}

                    {/* Alarm settings controls */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-450 uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" /> Awake Window
                        </span>
                        <span className="text-slate-350">{remindersStartTime} to {remindersEndTime}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-505 font-mono block uppercase">Start</label>
                          <input
                            type="time"
                            value={remindersStartTime}
                            onChange={(e) => setRemindersStartTime(e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500/50 font-mono text-center text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-505 font-mono block uppercase">End</label>
                          <input
                            type="time"
                            value={remindersEndTime}
                            onChange={(e) => setRemindersEndTime(e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500/50 font-mono text-center text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Interval dropdown calculated on goals */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 font-mono uppercase block">Interval Schedule</label>
                      <select
                        value={reminderInterval}
                        onChange={(e: any) => setReminderInterval(e.target.value)}
                        className="w-full bg-slate-900 border border-white/5 rounded-lg px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500/50 font-mono text-xs cursor-pointer"
                      >
                        <option value="auto">Auto (Divided by target: {WATER_GOAL} glasses)</option>
                        <option value="30">Every 30 Minutes</option>
                        <option value="60">Every 1 Hour</option>
                        <option value="120">Every 2 Hours</option>
                        <option value="180">Every 3 Hours</option>
                      </select>
                      
                      <p className="text-[9px] text-slate-450 leading-normal mt-1">
                        {reminderInterval === 'auto' ? (
                          <>
                            🤖 Awake window of <span className="font-bold text-slate-300 font-mono">{getWakeTimeSpan().toFixed(1)} hrs</span> divided by target <span className="font-bold text-slate-300 font-mono">{WATER_GOAL} glasses</span> schedules a remainder alert every <span className="font-bold text-blue-400 font-mono">{Math.round((getWakeTimeSpan() * 60) / WATER_GOAL)} minutes</span>.
                          </>
                        ) : (
                          <>
                            ⏳ Reminds you strictly every <span className="font-bold text-blue-400 font-mono">{reminderInterval} minutes</span> during awake window.
                          </>
                        )}
                      </p>
                    </div>

                    {/* Quick test control */}
                    <div className="flex gap-2 pt-1.5 border-t border-white/5">
                      <button
                        type="button"
                        onClick={triggerTestNotification}
                        className="flex-1 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 hover:border-white/10 text-slate-350 hover:text-white px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-blue-450" />
                        Trigger Test Alarm
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* Unit 2: Sleep Tracker */}
        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between transition relative overflow-hidden bg-white/5 ${data.sleepChecked ? 'border-emerald-500/25 bg-emerald-500/[0.02]' : 'border-white/5 hover:bg-white/[0.07]'}`}>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${data.sleepChecked ? 'bg-emerald-400/20 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Sleep Duration</h4>
                <p className="text-[9px] text-slate-400 font-mono">Goal: {SLEEP_GOAL.toFixed(1)} hrs</p>
              </div>
            </div>

            <button
              id="chk-sleep"
              onClick={toggleSleep}
              className={`p-1 rounded cursor-pointer transition border ${data.sleepChecked ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-transparent border-white/20 hover:border-slate-400 text-transparent'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 fill-current text-current" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black font-mono text-white">
                {data.sleep.toFixed(1)} <span className="text-xs font-normal opacity-50">hours</span>
              </span>
              <span className="text-[9px] text-slate-350 font-mono bg-white/5 px-1.5 py-0.5 rounded text-center">
                {data.sleep === 0 ? 'Not logged' : data.sleep < 6 ? '🥱 Light' : data.sleep < SLEEP_GOAL ? '😴 Adequate' : '⚡ Rested'}
              </span>
            </div>

            {/* Change values buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={decrementSleep}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-1.5 text-[9px] font-mono text-slate-400">0.5h</span>
                <button
                  type="button"
                  onClick={incrementSleep}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Sleep visual background bar */}
              <div className="flex-1 max-w-[80px] h-1 bg-white/5 rounded overflow-hidden relative mx-2">
                <div 
                  className="h-full bg-purple-400 rounded transition"
                  style={{ width: `${Math.min(100, (data.sleep / SLEEP_GOAL) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Unit 3: Active Minutes Tracker */}
        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between transition relative overflow-hidden bg-white/5 ${data.activeChecked ? 'border-emerald-500/25 bg-emerald-500/[0.02]' : 'border-white/5 hover:bg-white/[0.07]'}`}>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${data.activeChecked ? 'bg-emerald-400/20 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Active Minutes</h4>
                <p className="text-[9px] text-slate-400 font-mono">Goal: {ACTIVE_GOAL} mins</p>
              </div>
            </div>

            <button
              id="chk-active"
              onClick={toggleActive}
              className={`p-1 rounded cursor-pointer transition border ${data.activeChecked ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-transparent border-white/20 hover:border-slate-400 text-transparent'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 fill-current text-current" />
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-black font-mono text-white">
                {data.activeMinutes} <span className="text-xs font-normal opacity-50">mins</span>
              </span>
              <span className="text-[9px] text-slate-450 font-mono">
                {data.activeMinutes >= ACTIVE_GOAL ? 'Target met! 🏃' : `${Math.max(0, ACTIVE_GOAL - data.activeMinutes)}m remaining`}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-white/5 border border-white/5 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={decrementActive}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-1.5 text-[9px] font-mono text-slate-400">5m</span>
                <button
                  type="button"
                  onClick={incrementActive}
                  className="p-1 hover:bg-white/10 text-slate-300 rounded transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Progress dynamic line */}
              <div className="flex-1 max-w-[80px] h-1 bg-white/5 rounded overflow-hidden relative mx-2">
                <div 
                  className="h-full bg-orange-450 rounded transition animate-pulse"
                  style={{ width: `${Math.min(100, (data.activeMinutes / ACTIVE_GOAL) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Submission section with customizable feed messages */}
      <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full">
          <AnimatePresence mode="wait">
            {submitMessage && (
              <motion.div
                key={submitMessage}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-mono font-bold leading-normal text-left ${
                  submitMessage.includes("No worries")
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                    : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-current" />
                <span>{submitMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button
          onClick={handleSubmitChecklist}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <CheckCircle2 className="w-4 h-4 text-slate-950 fill-none" />
          Submit Checklist
        </button>
      </div>

      {/* Success notification panel */}
      <AnimatePresence>
        {completionPercent === 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 mt-5 text-left"
          >
            <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Amazing Job! Full Core Habits Locked! 🏆</span>
              <p className="text-[10px] text-slate-350">You've successfully finished hydration, active minutes, and sleep hours goals for today. Premium biological alignment achieved.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating alert/reminders toasts stack container */}
      <div className="absolute bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-xs w-72">
        <AnimatePresence>
          {activeToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="pointer-events-auto bg-slate-900/95 border border-blue-500/30 shadow-[0_4px_20px_rgba(59,130,246,0.15)] rounded-xl p-3 flex items-start gap-2 text-left backdrop-blur-md relative"
            >
              <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
                <Droplet className="w-4 h-4 fill-current text-blue-450 animate-bounce" />
              </div>
              <div className="space-y-0.5 pr-4 flex-1">
                <span className="text-[10px] font-bold text-white block">{toast.title}</span>
                <p className="text-[9px] text-slate-300 leading-normal font-sans">{toast.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveToasts(prev => prev.filter(t => t.id !== toast.id));
                }}
                className="absolute top-2.5 right-2.5 text-slate-550 hover:text-white transition text-[9px] font-mono cursor-pointer bg-white/5 hover:bg-white/10 w-4 h-4 rounded-full flex items-center justify-center p-0"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
