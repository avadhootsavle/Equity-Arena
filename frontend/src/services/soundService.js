/**
 * Web Audio API Sound Service for Equity Arena
 * Provides clean, professional 0.4s dual-tone UI alert chimes (D5 -> A5)
 * Handles browser autoplay policies, volume gain, mute toggle, and localStorage persistence.
 */

let audioCtx = null;
let lastPlayTime = 0;

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
 * Plays a warm, professional 0.4s dual-tone news alert chime (D5 -> A5)
 */
export function playNewsChime() {
  if (isSoundMuted()) return;

  const now = Date.now();
  if (now - lastPlayTime < 1000) return; // Debounce triggers within 1 second
  lastPlayTime = now;

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

    // Warm gain envelope: fast attack (0.01s), decay (0.35s), increased peak gain (0.85)
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
