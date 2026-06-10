// Celebration helpers: confetti bursts + synthesized sounds via Web Audio API.
// All functions are no-ops on the server.

import confetti from "canvas-confetti";

let cachedSoundPref: boolean | null = null;

export function setSoundEnabled(enabled: boolean) {
  cachedSoundPref = enabled;
}

function shouldPlaySound(): boolean {
  if (typeof window === "undefined") return false;
  if (cachedSoundPref === false) return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

function shouldShowConfetti(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function tone(freq: number, durationMs: number, startOffsetMs = 0, type: OscillatorType = "sine", gain = 0.12) {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime + startOffsetMs / 1000;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.05);
}

function playWinSound(intensity: "small" | "medium" | "big" = "medium") {
  if (!shouldPlaySound()) return;
  // C major arpeggio scaled by intensity
  const base = intensity === "big" ? 523.25 : intensity === "medium" ? 392 : 329.63;
  tone(base, 140, 0, "triangle", 0.14);
  tone(base * 1.25, 140, 90, "triangle", 0.13);
  tone(base * 1.5, 200, 180, "triangle", 0.12);
  if (intensity === "big") tone(base * 2, 280, 280, "triangle", 0.11);
}

function playLevelUpSound() {
  if (!shouldPlaySound()) return;
  const notes = [392, 523.25, 659.25, 783.99];
  notes.forEach((f, i) => tone(f, 200, i * 110, "triangle", 0.13));
}

function playBadgeSound() {
  if (!shouldPlaySound()) return;
  tone(880, 100, 0, "sine", 0.12);
  tone(1320, 120, 70, "sine", 0.1);
}

export function celebrateWin(pointsWon: number) {
  const intensity = pointsWon >= 100 ? "big" : pointsWon >= 30 ? "medium" : "small";
  if (shouldShowConfetti()) {
    const count = intensity === "big" ? 120 : intensity === "medium" ? 70 : 35;
    confetti({
      particleCount: count,
      spread: intensity === "big" ? 100 : 70,
      origin: { y: 0.55 },
      colors: ["#2756e6", "#5b8def", "#e6edff", "#1f9d6a", "#ffffff"],
    });
  }
  playWinSound(intensity);
}

export function celebrateLevelUp() {
  if (shouldShowConfetti()) {
    confetti({
      particleCount: 140,
      spread: 120,
      origin: { y: 0.4 },
      colors: ["#f4c542", "#fae27e", "#fff4c2", "#2756e6"],
      ticks: 250,
    });
    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.6 },
        colors: ["#f4c542", "#fae27e"],
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.6 },
        colors: ["#f4c542", "#fae27e"],
      });
    }, 200);
  }
  playLevelUpSound();
}

export function celebrateBadge() {
  if (shouldShowConfetti()) {
    confetti({
      particleCount: 60,
      spread: 60,
      startVelocity: 35,
      origin: { y: 0.3 },
      colors: ["#2756e6", "#5b8def", "#e6edff", "#ffffff"],
      shapes: ["star", "circle"],
    });
  }
  playBadgeSound();
}

export function celebrateXp() {
  // Micro-feedback only: just a soft tick. No confetti.
  if (!shouldPlaySound()) return;
  tone(880, 70, 0, "sine", 0.08);
}
