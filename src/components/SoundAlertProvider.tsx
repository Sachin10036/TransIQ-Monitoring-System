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

// Generate alert beep using Web Audio API (no external files needed)
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

// Speak a voice alert using Web Speech API
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

export default function SoundAlertProvider({ children, systemStatus }: SoundAlertProviderProps) {
  const [isMuted, setIsMuted] = useState(false);
  const previousStatusRef = useRef<SystemStatus>(systemStatus);
  const hasInteractedRef = useRef(false);

  // Track user interaction (required for Web Audio API autoplay policy)
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

  // Sound + Voice trigger: fires only when status CHANGES
  useEffect(() => {
    const prevStatus = previousStatusRef.current;
    previousStatusRef.current = systemStatus;

    // Only trigger on state transition, not on initial load or same state
    if (prevStatus === systemStatus) return;
    if (isMuted) return;
    if (!hasInteractedRef.current) return;

    if (systemStatus === 'critical') {
      playAlertSound('critical');
      // Voice announcement after a short delay so beep plays first
      setTimeout(() => {
        speakAlert('Warning. Critical alert detected. Immediate attention required.');
      }, 600);
    } else if (systemStatus === 'warning') {
      playAlertSound('warning');
      setTimeout(() => {
        speakAlert('Caution. System warning detected. Please check sensor readings.');
      }, 500);
    }
    // No sound when returning to normal ('healthy')
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
