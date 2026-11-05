'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { SoundType, UseSoundReturn } from '@/types';

// High-performance local sound files located in public/sounds
const SOUND_URLS: Record<SoundType, string> = {
  correct: '/sounds/correct.wav?v=2',
  wrong: '/sounds/wrong.wav?v=2',
  countdown: '/sounds/urgent_tick.wav?v=2',
  reveal: '/sounds/reveal.wav?v=2',
  finish: '/sounds/victory.wav?v=2',
  tick: '/sounds/tick.wav?v=2',
  urgent_tick: '/sounds/urgent_tick.wav?v=2',
  question_battle: '/sounds/question_battle.wav?v=2',
  lobby: '/sounds/lobby.wav?v=2',
  victory: '/sounds/victory.wav?v=2',
};

const BGM_DEFAULTS: Record<string, { volume: number; loop: boolean }> = {
  lobby: { volume: 0.45, loop: true },
  question_battle: { volume: 0.55, loop: true },
  victory: { volume: 0.65, loop: true },
};

export function useSound(initialEnabled: boolean = true): UseSoundReturn {
  // Read preference from localStorage if previously set, fallback to initialEnabled
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quiz_sound_enabled');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return initialEnabled;
  });

  const soundsRef = useRef<Record<string, any>>({});
  const isLoadedRef = useRef(false);
  const currentBgmRef = useRef<'lobby' | 'question_battle' | 'victory' | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  // Keep ref synced for callbacks
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Set sound enabled with localStorage persistence
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    soundEnabledRef.current = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_sound_enabled', enabled ? 'true' : 'false');
    }

    if (!enabled) {
      // Immediately stop all sounds and BGM
      Object.values(soundsRef.current).forEach((howl) => {
        try {
          howl.stop();
        } catch {}
      });
    } else {
      // Resume current BGM if one was active
      const activeBgm = currentBgmRef.current;
      if (activeBgm && soundsRef.current[activeBgm]) {
        try {
          const howl = soundsRef.current[activeBgm];
          if (!howl.playing()) {
            howl.play();
          }
        } catch {}
      }
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(!soundEnabledRef.current);
  }, [setSoundEnabled]);

  // Unlock browser audio context on first interaction
  const unlockAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      import('howler').then(({ Howler }) => {
        if (Howler && Howler.ctx && Howler.ctx.state === 'suspended') {
          Howler.ctx.resume().catch(() => {});
        }
      });
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFirstInteraction = () => {
      unlockAudioContext();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [unlockAudioContext]);

  // Load Howler and initialize sound objects
  useEffect(() => {
    if (typeof window === 'undefined' || isLoadedRef.current) return;

    const loadHowler = async () => {
      try {
        const { Howl, Howler } = await import('howler');
        isLoadedRef.current = true;

        // Auto-unlock audio for mobile and desktop browsers
        Howler.autoUnlock = true;

        Object.entries(SOUND_URLS).forEach(([key, url]) => {
          const isBgm = key in BGM_DEFAULTS;
          const config = BGM_DEFAULTS[key] || { volume: 0.7, loop: false };

          soundsRef.current[key] = new Howl({
            src: [url],
            volume: config.volume,
            loop: config.loop,
            preload: true,
            html5: isBgm, // Stream longer BGM files smoothly
          });
        });

        // If a BGM was requested prior to load, start it now
        if (soundEnabledRef.current && currentBgmRef.current) {
          const bgm = currentBgmRef.current;
          soundsRef.current[bgm]?.play();
        }
      } catch (e) {
        console.error('Failed to initialize audio engine:', e);
      }
    };

    loadHowler();

    return () => {
      // Cleanup on unmount
      Object.values(soundsRef.current).forEach((h) => {
        try {
          h.stop();
        } catch {}
      });
    };
  }, []);

  // Play sound effect with optional loop / custom volume
  const play = useCallback(
    (sound: SoundType, options?: { loop?: boolean; volume?: number }) => {
      if (!soundEnabledRef.current || typeof window === 'undefined') return;
      unlockAudioContext();

      const howl = soundsRef.current[sound];
      if (howl) {
        if (options?.volume !== undefined) howl.volume(options.volume);
        if (options?.loop !== undefined) howl.loop(options.loop);
        howl.play();
      }
    },
    [unlockAudioContext]
  );

  // Stop specific sound or all sounds
  const stop = useCallback((sound?: SoundType) => {
    if (sound) {
      soundsRef.current[sound]?.stop();
    } else {
      Object.values(soundsRef.current).forEach((h) => {
        try {
          h.stop();
        } catch {}
      });
    }
  }, []);

  // Dedicated Background Music Orchestrator
  const playBGM = useCallback(
    (bgm: 'lobby' | 'question_battle' | 'victory', volume?: number) => {
      if (typeof window === 'undefined') return;
      unlockAudioContext();

      // If already playing this BGM, don't restart from beginning
      if (currentBgmRef.current === bgm && soundsRef.current[bgm]?.playing()) {
        return;
      }

      // Stop any previously playing BGM
      const oldBgm = currentBgmRef.current;
      if (oldBgm && oldBgm !== bgm && soundsRef.current[oldBgm]) {
        try {
          soundsRef.current[oldBgm].stop();
        } catch {}
      }

      currentBgmRef.current = bgm;

      if (!soundEnabledRef.current) return;

      const howl = soundsRef.current[bgm];
      if (howl) {
        const defaultVol = BGM_DEFAULTS[bgm]?.volume ?? 0.5;
        howl.volume(volume ?? defaultVol);
        howl.loop(true);
        if (!howl.playing()) {
          howl.play();
        }
      }
    },
    [unlockAudioContext]
  );

  const stopBGM = useCallback(() => {
    const bgm = currentBgmRef.current;
    if (bgm && soundsRef.current[bgm]) {
      try {
        soundsRef.current[bgm].stop();
      } catch {}
    }
    currentBgmRef.current = null;
  }, []);

  return {
    play,
    stop,
    playBGM,
    stopBGM,
    soundEnabled,
    setSoundEnabled,
    toggleSound,
  };
}
