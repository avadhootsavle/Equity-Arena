/**
 * Web Audio API Sound Service for Equity Arena
 * Provides clean, professional 0.4s dual-tone UI alert chimes (D5 -> A5)
 * Handles browser autoplay policies, volume gain, mute toggle, and localStorage persistence.
 */

let audioCtx = null;
let lastPlayTime = 0;
let customSoundUrl = '/sounds/notification.mp3';

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  // Resume context if suspended by browser autoplay restrictions
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

// Global user interaction listener to unlock AudioContext
function unlockAudioOnInteraction() {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    }
  };

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
}

// Initialize interaction unlocker immediately on module load
if (typeof window !== 'undefined') {
  unlockAudioOnInteraction();
}

/**
 * Allows setting a custom MP3 audio file URL
 * e.g., setCustomSoundUrl('/sounds/my_bell.mp3')
 */
export function setCustomSoundUrl(url) {
  if (url) {
    customSoundUrl = url;
  }
}

/**
 * Gets mute status from localStorage (default: false / sound ON)
 */
export function isSoundMuted() {
  try {
    const stored = localStorage.getItem('equity_news_sound_muted');
    return stored === 'true';
  } catch (err) {
    return false;
  }
}

/**
 * Toggles sound mute status in localStorage
 */
export function toggleSoundMute() {
  try {
    const current = isSoundMuted();
    const next = !current;
    localStorage.setItem('equity_news_sound_muted', String(next));
    return next;
  } catch (err) {
    return false;
  }
}

/**
 * Plays news notification chime.
 * Tries custom MP3 file first (e.g. /sounds/notification.mp3),
 * falling back to synthesized dual-tone Web Audio chime if MP3 is missing.
 */
export function playNewsChime() {
  if (isSoundMuted()) return;

  const now = Date.now();
  if (now - lastPlayTime < 1000) return; // Debounce triggers within 1 second
  lastPlayTime = now;

  // Candidate sound URLs to try in order
  const soundCandidates = Array.from(new Set([
    customSoundUrl,
    '/sounds/notification.mp3',
    '/notification.mp3'
  ])).filter(Boolean);

  let triedCount = 0;

  const tryPlayCandidate = (index) => {
    if (index >= soundCandidates.length) {
      playSynthesizedChime();
      return;
    }

    const url = soundCandidates[index];
    const audio = new Audio(url);
    audio.volume = 0.85;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // MP3 played successfully!
        })
        .catch(() => {
          // Candidate failed, try next URL candidate
          tryPlayCandidate(index + 1);
        });
    } else {
      tryPlayCandidate(index + 1);
    }
  };

  tryPlayCandidate(0);
}

/**
 * Fallback Web Audio API dual-tone synthesized chime (D5 -> A5)
 */
function playSynthesizedChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const currentTime = ctx.currentTime;

    // Primary Tone Oscillator (D5 -> A5 frequency shift)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    
    // Frequency ramp: D5 (587.33 Hz) to A5 (880.00 Hz)
    osc.frequency.setValueAtTime(587.33, currentTime);
    osc.frequency.exponentialRampToValueAtTime(880.00, currentTime + 0.12);

    // Warm gain envelope
    gain.gain.setValueAtTime(0.001, currentTime);
    gain.gain.linearRampToValueAtTime(0.85, currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(currentTime);
    osc.stop(currentTime + 0.40);
  } catch (err) {
    console.error('Audio chime playback error:', err);
  }
}
