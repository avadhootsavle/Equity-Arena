import notificationMp3Asset from '../notification.mp3';

let audioCtx = null;
let lastPlayTime = 0;
let customSoundUrl = notificationMp3Asset || '/sounds/notification.mp3';
let decodedMp3Buffer = null;
let isDecoding = false;

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

// Pre-fetch and decode the MP3 file into a Web Audio buffer for 100% instant playback
async function loadAndDecodeMp3() {
  if (decodedMp3Buffer || isDecoding) return;
  isDecoding = true;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const urlsToTry = [notificationMp3Asset, '/sounds/notification.mp3', '/notification.mp3'].filter(Boolean);
    
    for (const url of urlsToTry) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          decodedMp3Buffer = await ctx.decodeAudioData(arrayBuffer);
          console.log('✅ Custom MP3 notification sound decoded & ready');
          break;
        }
      } catch (e) {
        // Try next candidate URL
      }
    }
  } catch (err) {
    console.error('Failed to decode custom MP3 audio:', err);
  } finally {
    isDecoding = false;
  }
}

// Global user interaction listener to unlock AudioContext and decode MP3
function unlockAudioOnInteraction() {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      loadAndDecodeMp3();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    }
  };

  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
}

// Initialize interaction unlocker and attempt load immediately
if (typeof window !== 'undefined') {
  unlockAudioOnInteraction();
  loadAndDecodeMp3();
}

/**
 * Allows setting a custom MP3 audio file URL
 */
export function setCustomSoundUrl(url) {
  if (url) {
    customSoundUrl = url;
    decodedMp3Buffer = null;
    loadAndDecodeMp3();
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
 * Uses decoded custom MP3 buffer first, falling back to Web Audio synthesis if unavailable.
 */
export function playNewsChime() {
  if (isSoundMuted()) return;

  const now = Date.now();
  if (now - lastPlayTime < 1000) return; // Debounce triggers within 1 second
  lastPlayTime = now;

  const ctx = getAudioContext();
  if (!ctx) return;

  // If AudioContext is suspended, resume it
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  // 1. Play decoded MP3 buffer if available
  if (decodedMp3Buffer) {
    try {
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      source.buffer = decodedMp3Buffer;
      gainNode.gain.setValueAtTime(0.85, ctx.currentTime);
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
      return;
    } catch (err) {
      console.error('Error playing decoded MP3 buffer:', err);
    }
  }

  // 2. Try HTML5 Audio fallback
  try {
    const audio = new Audio(customSoundUrl || notificationMp3Asset);
    audio.volume = 0.85;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {}).catch(() => {
        playSynthesizedChime();
      });
      return;
    }
  } catch (e) {
    // Fall through to synthesis
  }

  // 3. Fallback to Web Audio synthesized chime
  playSynthesizedChime();
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
