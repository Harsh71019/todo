// utils/sound.ts
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const playTone = (freq: number, duration: number) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = freq;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Web Audio API not supported or blocked', e);
  }
};

export const playPomodoroComplete = () => playTone(880, 1.2); // high ping
export const playBreakComplete    = () => playTone(440, 1.2); // lower ping
