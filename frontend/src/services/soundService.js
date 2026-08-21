import notificationMp3Asset from '../notification.mp3';

let audioCtx = null;
let lastPlayTime = 0;
let customSoundUrl = notificationMp3Asset || '/sounds/notification.mp3';
let decodedMp3Buffer = null;
let isDecoding = false;
let preloadedAudio = null;

if (typeof window !== 'undefined') {
  try {
    preloadedAudio = new Audio(customSoundUrl);
    preloadedAudio.preload = 'auto';
    preloadedAudio.load();
  } catch (e) {}
}

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
      if (preloadedAudio) {
        preloadedAudio.load();
      }
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
    if (typeof window !== 'undefined') {
      try {
        preloadedAudio = new Audio(url);
        preloadedAudio.preload = 'auto';
        preloadedAudio.load();
      } catch (e) {}
    }
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
 * Uses decoded custom MP3 buffer first for 0ms instant sync.
 */
let isPlayingQueue = false;
const newsSoundQueue = [];

/**
 * Internal audio executor
 */
function executeChimeSound() {
  const ctx = getAudioContext();

  // 1. Play decoded MP3 Web Audio buffer (0ms instant sync)
  if (ctx && decodedMp3Buffer) {
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
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

  // 2. Try preloaded HTML5 Audio element for instant playback
  if (preloadedAudio) {
    try {
      preloadedAudio.currentTime = 0;
      preloadedAudio.volume = 0.85;
      const playPromise = preloadedAudio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {}).catch(() => {
          playSynthesizedChime();
        });
        return;
      }
    } catch (e) {}
  }

  // 3. Fallback to Web Audio synthesized chime
  playSynthesizedChime();
}

function processAudioQueue() {
  if (isPlayingQueue || newsSoundQueue.length === 0) return;

  isPlayingQueue = true;
  newsSoundQueue.shift(); // Remove current item

  executeChimeSound();

  // Wait 1.0s (length of chime) before processing next sound in queue so sounds never stack or overlap
  setTimeout(() => {
    isPlayingQueue = false;
    processAudioQueue();
  }, 1000);
}

/**
 * Plays news notification chime exactly ONCE per news broadcast.
 * Features cross-tab deduplication via localStorage, tab-visibility check, and non-overlapping queueing.
 */
export function playNewsChime(eventId) {
  if (isSoundMuted()) return;

  // 1. Multi-tab check: Only active visible tab plays sound
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return;
  }

  // 2. Cross-tab & multi-socket deduplication via localStorage news ID tracking
  if (eventId) {
    try {
      const lastId = localStorage.getItem('equity_last_played_news_id');
      if (lastId === String(eventId)) {
        return; // Already played globally by this or another tab!
      }
      localStorage.setItem('equity_last_played_news_id', String(eventId));
    } catch (e) {}
  }

  const now = Date.now();
  if (!eventId && now - lastPlayTime < 800) return; // Debounce anonymous triggers within 0.8s
  lastPlayTime = now;

  // 3. Queue sound to ensure consecutive events play sequentially without stacking/overlapping
  newsSoundQueue.push(eventId || now);
  processAudioQueue();
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
