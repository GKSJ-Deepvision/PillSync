/**
 * PillSync Audio & Web Push Notifications Engine
 * Uses Web Audio API for medical dose alert chime synthesis
 * Uses HTML5 Notification API for native OS alerts
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a pleasant medical two-tone dose alert chime
 */
export function playDoseAlertChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Tone 2: G5 (783.99 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.18);
    gain2.gain.setValueAtTime(0, now + 0.18);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.23);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.66);
  } catch (err) {
    console.warn('Audio chime notice:', err);
  }
}

/**
 * Requests native browser push notification permission
 */
export async function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        return await Notification.requestPermission();
      } catch (e) {
        console.warn('Notification permission request:', e);
      }
    }
    return Notification.permission;
  }
  return 'denied';
}

/**
 * Dispatches an OS-level dose reminder notification
 */
export function dispatchNativeDoseAlert(title, message) {
  playDoseAlertChime();

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title || 'PillSync Medication Reminder', {
          body: message || 'It is time for your scheduled dosage.',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
        });
      } catch (err) {
        console.warn('Native notification notice:', err);
      }
    } else if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}
