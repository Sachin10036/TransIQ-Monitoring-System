'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { SystemStatus } from '@/lib/types';

interface SoundAlertContextValue {
  isMuted: boolean;
  toggleMute: () => void;
}

const SoundAlertContext = createContext<SoundAlertContextValue>({
  isMuted: false,
  toggleMute: () => {},
});

export function useSoundAlert() {
  return useContext(SoundAlertContext);
}

interface SoundAlertProviderProps {
  children: React.ReactNode;
  systemStatus: SystemStatus;
}

// ── Web Audio beep generator ─────────────────────────────────────────────
function playAlertSound(type: 'critical' | 'warning') {
  try {
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    if (type === 'critical') {
      // Urgent two-tone alarm — high frequency, quick repetition
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Three rapid beeps
      playTone(880, audioCtx.currentTime, 0.15);
      playTone(1100, audioCtx.currentTime + 0.18, 0.15);
      playTone(880, audioCtx.currentTime + 0.36, 0.2);
    } else {
      // Softer single chime for warning
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.4);
    }

    // Clean up audio context after sounds finish
    setTimeout(() => {
      audioCtx.close();
    }, 1000);
  } catch {
    // Silently fail if audio API is not available
  }
}

// ── Web Speech voice announcement ────────────────────────────────────────
function speakAlert(message: string) {
  try {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech to avoid overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.1;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    window.speechSynthesis.speak(utterance);
  } catch {
    // Silently fail if Speech API is not available
  }
}

// ── Provider Component ───────────────────────────────────────────────────
export default function SoundAlertProvider({ children, systemStatus }: SoundAlertProviderProps) {
  const [isMuted, setIsMuted] = useState(false);

  // Track whether an alert is currently active (playing state)
  // This prevents repeated triggering on every re-render while status stays critical.
  const isAlertActiveRef = useRef(false);

  // Track whether the component has completed its initial mount.
  // We skip the very first effect run so that a page-load into a critical state
  // still triggers the alert on the NEXT status evaluation (after the first render).
  const isFirstRenderRef = useRef(true);

  // Track user interaction (required for Web Audio API autoplay policy)
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    const handleInteraction = () => {
      hasInteractedRef.current = true;
    };
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Load mute state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('transiq-muted');
    if (saved === 'true') setIsMuted(true);
  }, []);

  // ── Core alert logic ─────────────────────────────────────────────────
  // Rules:
  //   • Play sound + voice ONCE when system enters critical and no alert is active.
  //   • When system returns to healthy/normal (no critical), mark alert inactive.
  //   • Re-trigger only on a new normal → critical transition.
  //   • Do NOT replay on every render while status stays the same.
  useEffect(() => {
    // Skip the very first render so that the initial data load is treated
    // as the baseline. The next status update will be compared against it.
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      // If we load straight into critical, arm the alert for immediate firing
      // by NOT setting isAlertActiveRef.  This way the second effect run
      // (triggered by the next poll or status change) will fire the alert.
      return;
    }

    const isCritical = systemStatus === 'critical';
    const isWarning = systemStatus === 'warning';

    // ── CRITICAL detected & alert not already playing ──
    if (isCritical && !isAlertActiveRef.current) {
      isAlertActiveRef.current = true;

      if (!isMuted && hasInteractedRef.current) {
        playAlertSound('critical');
        // Voice announcement after a short delay so beep plays first
        setTimeout(() => {
          speakAlert('Warning. Critical alert detected. Immediate attention required.');
        }, 600);
      }
    }

    // ── WARNING (non-critical) & alert not already playing ──
    if (isWarning && !isCritical && !isAlertActiveRef.current) {
      // We don't set isAlertActiveRef for warnings — they are one-shot chimes
      // that don't block future critical alerts.
      if (!isMuted && hasInteractedRef.current) {
        playAlertSound('warning');
        setTimeout(() => {
          speakAlert('Caution. System warning detected. Please check sensor readings.');
        }, 500);
      }
    }

    // ── System returned to HEALTHY — reset the alert gate ──
    if (!isCritical && !isWarning && isAlertActiveRef.current) {
      isAlertActiveRef.current = false;

      // Stop any ongoing speech
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    // Also reset if we drop from critical to warning
    if (!isCritical && isAlertActiveRef.current) {
      isAlertActiveRef.current = false;
    }
  }, [systemStatus, isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('transiq-muted', String(next));
      // Stop any ongoing speech when muting
      if (next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  }, []);

  return (
    <SoundAlertContext.Provider value={{ isMuted, toggleMute }}>
      {children}
    </SoundAlertContext.Provider>
  );
}
