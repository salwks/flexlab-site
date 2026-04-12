import * as Tone from "tone";

// Pentatonic scale — any combination sounds good
const SCALE = ["C3", "D3", "E3", "G3", "A3", "C4", "D4", "E4", "G4", "A4"];
const LOW_SCALE = ["C2", "D2", "E2", "G2", "A2"];
const HIGH_SCALE = ["C5", "D5", "E5", "G5", "A5"];

// Prime-number intervals for non-repeating patterns
const PAD_INTERVAL = 7;
const BELL_INTERVAL = 11;
const BASS_INTERVAL = 13;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type Mood = "bright" | "dark" | "ethereal";

export class SoundEngine {
  private padSynth: Tone.PolySynth | null = null;
  private bellSynth: Tone.Synth | null = null;
  private pluckSynth: Tone.PluckSynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private delay: Tone.FeedbackDelay | null = null;
  private filter: Tone.Filter | null = null;
  private masterGain: Tone.Gain | null = null;
  private padLoop: Tone.Loop | null = null;
  private bellLoop: Tone.Loop | null = null;
  private bassLoop: Tone.Loop | null = null;
  private started = false;
  private mood: Mood = "bright";

  async start() {
    if (this.started) return;
    await Tone.start();

    // Master chain
    this.masterGain = new Tone.Gain(0.6).toDestination();
    this.reverb = new Tone.Reverb({ decay: 5, wet: 0.7 }).connect(
      this.masterGain,
    );
    this.delay = new Tone.FeedbackDelay({
      delayTime: 0.35,
      feedback: 0.25,
      wet: 0.3,
    }).connect(this.reverb);
    this.filter = new Tone.Filter({
      frequency: 2000,
      type: "lowpass",
    }).connect(this.delay);

    // Pad synth — warm, slow attack
    this.padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 2.5, decay: 1, sustain: 0.6, release: 4 },
      volume: -18,
    }).connect(this.filter);

    // Bell synth — soft high tone
    this.bellSynth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.05, decay: 1.5, sustain: 0, release: 2 },
      volume: -22,
    }).connect(this.filter);

    // Pluck synth — for interactive string plucking
    this.pluckSynth = new Tone.PluckSynth({
      attackNoise: 1.5,
      dampening: 3000,
      resonance: 0.95,
      volume: -12,
    }).connect(this.filter);

    // Ambient loops
    this.padLoop = new Tone.Loop((time) => {
      const note = pick(SCALE);
      this.padSynth?.triggerAttackRelease(note, "2n", time);
    }, PAD_INTERVAL);

    this.bellLoop = new Tone.Loop((time) => {
      const note = pick(HIGH_SCALE);
      this.bellSynth?.triggerAttackRelease(note, "4n", time);
    }, BELL_INTERVAL);

    this.bassLoop = new Tone.Loop((time) => {
      const note = pick(LOW_SCALE);
      this.padSynth?.triggerAttackRelease(note, "1n", time, 0.3);
    }, BASS_INTERVAL);

    this.padLoop.start(0);
    this.bellLoop.start(2);
    this.bassLoop.start(4);

    Tone.getTransport().start();
    this.started = true;
  }

  stop() {
    if (!this.started) return;
    this.padLoop?.stop();
    this.bellLoop?.stop();
    this.bassLoop?.stop();
    Tone.getTransport().stop();
    this.padSynth?.dispose();
    this.bellSynth?.dispose();
    this.pluckSynth?.dispose();
    this.reverb?.dispose();
    this.delay?.dispose();
    this.filter?.dispose();
    this.masterGain?.dispose();
    this.started = false;
  }

  private lastTriggerTime = 0;

  triggerNote(index: number) {
    if (!this.pluckSynth) return;
    const now = Tone.now();
    // Prevent overlapping triggers (min 50ms apart)
    if (now - this.lastTriggerTime < 0.05) return;
    this.lastTriggerTime = now;

    const noteIndex = index % SCALE.length;
    const note = SCALE[noteIndex];
    this.pluckSynth.triggerAttackRelease(note, "8n", now);
  }

  setMood(mood: Mood) {
    this.mood = mood;
    if (!this.filter || !this.reverb || !this.padSynth) return;

    switch (mood) {
      case "bright":
        this.filter.frequency.rampTo(3000, 2);
        this.reverb.set({ decay: 4 });
        this.padSynth.set({ volume: -18 });
        break;
      case "dark":
        this.filter.frequency.rampTo(800, 2);
        this.reverb.set({ decay: 7 });
        this.padSynth.set({ volume: -14 });
        break;
      case "ethereal":
        this.filter.frequency.rampTo(5000, 2);
        this.reverb.set({ decay: 8 });
        this.padSynth.set({ volume: -20 });
        break;
    }
  }

  getMood() {
    return this.mood;
  }

  isStarted() {
    return this.started;
  }
}
