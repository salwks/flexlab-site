import * as Tone from "tone";

const PENTA = ["C3","D3","E3","G3","A3","C4","D4","E4","G4","A4"];
const MINOR = ["C3","D3","Eb3","F3","G3","Ab3","Bb3","C4","D4","Eb4"];
const DORIAN = ["C3","D3","Eb3","F3","G3","A3","Bb3","C4","D4","Eb4"];
const WHOLE = ["C3","D3","E3","F#3","G#3","A#3","C4","D4","E4","F#4"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type Mood = "bright" | "dark" | "ethereal";

interface SoundStyle {
  name: string;
  setup: (engine: SoundEngine) => void;
}

const styles: SoundStyle[] = [
  {
    // Electronica: synth sequences + driving rhythm + evolving textures
    name: "electronica-sequence",
    setup: (e) => {
      const scale = pick([MINOR, DORIAN, WHOLE]);
      Tone.getTransport().bpm.value = pick([110, 118, 125, 130]);

      // Kick — punchy electronic
      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 8,
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 },
        volume: -12,
      }).connect(e.master!);

      // Clap/snare
      const clap = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
        volume: -18,
      }).connect(e.master!);

      // Synth lead — sequenced pattern
      const lead = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.4 },
        volume: -16,
      }).connect(e.filter!);

      // Bass
      const bass = new Tone.MonoSynth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2 },
        filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5, baseFrequency: 200, octaves: 2 },
        volume: -14,
      }).connect(e.filter!);

      // Hi-hat
      const hat = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 },
        volume: -24,
      }).connect(e.master!);

      // 4-on-the-floor
      const kickPattern = new Tone.Loop((time) => {
        kick.triggerAttackRelease("C1", "8n", time);
      }, "4n");

      // Clap on 2 and 4
      let beatCount = 0;
      const clapPattern = new Tone.Loop((time) => {
        beatCount++;
        if (beatCount % 2 === 0) clap.triggerAttackRelease("16n", time);
      }, "4n");

      // Offbeat hats
      const hatPattern = new Tone.Loop((time) => {
        hat.triggerAttackRelease("32n", time);
      }, "8n");

      // Sequenced melody — 8-step pattern, shifts every 4 bars
      let stepIndex = 0;
      let pattern = Array.from({ length: 8 }, () => Math.random() > 0.3 ? pick(scale) : null);
      let barCount = 0;
      const seqPattern = new Tone.Loop((time) => {
        const note = pattern[stepIndex % 8];
        if (note) lead.triggerAttackRelease(note, "16n", time);
        stepIndex++;
        if (stepIndex % 32 === 0) {
          barCount++;
          // Evolve pattern every 4 bars
          pattern = pattern.map((n) =>
            Math.random() < 0.3 ? (Math.random() > 0.3 ? pick(scale) : null) : n
          );
        }
      }, "8n");

      // Bass line — root notes
      const bassPattern = new Tone.Loop((time) => {
        bass.triggerAttackRelease(pick(scale.slice(0, 3)), "4n", time);
      }, "2n");

      kickPattern.start(0);
      clapPattern.start(0);
      hatPattern.start(0);
      seqPattern.start(0);
      bassPattern.start(0);

      e.disposables.push(kick, clap, lead, bass, hat, kickPattern, clapPattern, hatPattern, seqPattern, bassPattern);
    },
  },
  {
    // Electronica: arpeggiated synth + minimal beat
    name: "electronica-arp",
    setup: (e) => {
      const scale = pick([PENTA, DORIAN]);
      Tone.getTransport().bpm.value = pick([105, 112, 120]);

      const arp = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.15, sustain: 0.05, release: 0.5 },
        volume: -14,
      }).connect(e.filter!);

      const pad = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 2, decay: 1, sustain: 0.3, release: 3 },
        volume: -24,
      }).connect(e.filter!);

      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.04,
        octaves: 7,
        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.08 },
        volume: -14,
      }).connect(e.master!);

      const rim = new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
        volume: -22,
      }).connect(e.master!);

      let noteIdx = 0;
      const dir = pick([1, -1]); // ascending or descending
      const arpLoop = new Tone.Loop((time) => {
        const idx = Math.abs(noteIdx % scale.length);
        arp.triggerAttackRelease(scale[idx], "16n", time);
        noteIdx += dir;
        if (Math.random() < 0.1) noteIdx += pick([1, 2, -1]); // occasional jump
      }, "16n");

      const kickLoop = new Tone.Loop((time) => {
        kick.triggerAttackRelease("C1", "8n", time);
      }, "2n");

      const rimLoop = new Tone.Loop((time) => {
        if (Math.random() > 0.5) rim.triggerAttackRelease("32n", time);
      }, "8n");

      const padLoop = new Tone.Loop((time) => {
        pad.triggerAttackRelease(pick(scale.slice(0, 4)), "1n", time, 0.2);
      }, "4m");

      arpLoop.start(0);
      kickLoop.start(0);
      rimLoop.start(0);
      padLoop.start("2m");

      e.disposables.push(arp, pad, kick, rim, arpLoop, kickLoop, rimLoop, padLoop);
    },
  },
  {
    // Electronica: textural glitch + IDM-ish
    name: "electronica-texture",
    setup: (e) => {
      const scale = pick([WHOLE, MINOR]);
      Tone.getTransport().bpm.value = pick([88, 95, 100]);

      const glitchSynth = new Tone.FMSynth({
        harmonicity: pick([2, 3, 5]),
        modulationIndex: pick([5, 10, 15]),
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.3 },
        modulation: { type: "square" },
        volume: -16,
      }).connect(e.filter!);

      const sub = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.02, decay: 0.6, sustain: 0.3, release: 1.5 },
        volume: -14,
      }).connect(e.master!);

      const noise = new Tone.NoiseSynth({
        noise: { type: "brown" },
        envelope: { attack: 0.5, decay: 1, sustain: 0.2, release: 2 },
        volume: -28,
      }).connect(e.filter!);

      const metal = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
        harmonicity: 5.1,
        modulationIndex: 16,
        octaves: 1.5,
        volume: -26,
      }).connect(e.master!);

      // Irregular glitch hits
      const glitchLoop = new Tone.Loop((time) => {
        if (Math.random() > 0.4) {
          glitchSynth.triggerAttackRelease(pick(scale), pick(["32n","16n","8n"]), time);
        }
      }, pick(["8n", "8n.", "16n"]));

      const subLoop = new Tone.Loop((time) => {
        sub.triggerAttackRelease(pick(scale.slice(0, 3)), "4n", time);
      }, pick(["1n", "2n."]));

      const noiseLoop = new Tone.Loop((time) => {
        noise.triggerAttackRelease("4n", time);
      }, pick(["3m", "5m"]));

      const metalLoop = new Tone.Loop((time) => {
        if (Math.random() > 0.6) metal.triggerAttackRelease("32n", time);
      }, "4n");

      glitchLoop.start(0);
      subLoop.start("1m");
      noiseLoop.start("2m");
      metalLoop.start(0);

      e.disposables.push(glitchSynth, sub, noise, metal, glitchLoop, subLoop, noiseLoop, metalLoop);
    },
  },
  {
    // Electronica: dreamy synth chords + soft shuffle beat
    name: "electronica-dream",
    setup: (e) => {
      const scale = PENTA;
      Tone.getTransport().bpm.value = pick([90, 96, 102]);

      const chords = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.8, decay: 0.5, sustain: 0.4, release: 2.5 },
        volume: -18,
      }).connect(e.filter!);

      const pluck = new Tone.PluckSynth({
        attackNoise: 1,
        dampening: 2000,
        resonance: 0.9,
        volume: -14,
      }).connect(e.filter!);

      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
        volume: -16,
      }).connect(e.master!);

      const shaker = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
        volume: -28,
      }).connect(e.master!);

      // Chord progression
      const chordLoop = new Tone.Loop((time) => {
        const root = pick(scale.slice(0, 5));
        chords.triggerAttackRelease(root, "1n", time, 0.3);
      }, "2m");

      // Melodic plucks
      const pluckLoop = new Tone.Loop((time) => {
        if (Math.random() > 0.25) {
          pluck.triggerAttackRelease(pick(scale), time);
        }
      }, pick(["4n", "4n."]));

      // Soft kick
      const kickLoop = new Tone.Loop((time) => {
        kick.triggerAttackRelease("C1", "8n", time);
      }, "2n");

      // Shuffle shaker
      const shakerLoop = new Tone.Loop((time) => {
        if (Math.random() > 0.3) shaker.triggerAttackRelease("32n", time);
      }, "16n");

      chordLoop.start(0);
      pluckLoop.start("1m");
      kickLoop.start(0);
      shakerLoop.start(0);

      e.disposables.push(chords, pluck, kick, shaker, chordLoop, pluckLoop, kickLoop, shakerLoop);
    },
  },
];

// ─── Engine ───

export class SoundEngine {
  master: Tone.Gain | null = null;
  filter: Tone.Filter | null = null;
  private reverb: Tone.Reverb | null = null;
  private delay: Tone.FeedbackDelay | null = null;
  private pluckSynth: Tone.PluckSynth | null = null;
  private started = false;
  private mood: Mood = "bright";
  private lastTriggerTime = 0;
  private currentStyle: SoundStyle | null = null;
  disposables: { dispose: () => void }[] = [];

  async start() {
    if (this.started) return;
    await Tone.start();

    this.master = new Tone.Gain(0.45).toDestination();
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).connect(this.master);
    this.delay = new Tone.FeedbackDelay({
      delayTime: 0.2,
      feedback: 0.15,
      wet: 0.15,
    }).connect(this.reverb);
    this.filter = new Tone.Filter({
      frequency: 3500,
      type: "lowpass",
    }).connect(this.delay);

    this.pluckSynth = new Tone.PluckSynth({
      attackNoise: 1.5,
      dampening: 3000,
      resonance: 0.95,
      volume: -10,
    }).connect(this.filter);

    // Random style
    this.currentStyle = pick(styles);
    this.currentStyle.setup(this);

    Tone.getTransport().start();
    this.started = true;
  }

  stop() {
    if (!this.started) return;
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    this.pluckSynth?.dispose();
    this.reverb?.dispose();
    this.delay?.dispose();
    this.filter?.dispose();
    this.master?.dispose();
    this.started = false;
  }

  triggerNote(index: number) {
    if (!this.pluckSynth) return;
    const now = Tone.now();
    if (now - this.lastTriggerTime < 0.05) return;
    this.lastTriggerTime = now;
    const note = PENTA[index % PENTA.length];
    this.pluckSynth.triggerAttackRelease(note, "8n", now);
  }

  setMood(mood: Mood) {
    this.mood = mood;
    if (!this.filter || !this.reverb) return;
    switch (mood) {
      case "bright":
        this.filter.frequency.rampTo(4500, 2);
        this.reverb.set({ decay: 2 });
        break;
      case "dark":
        this.filter.frequency.rampTo(1500, 2);
        this.reverb.set({ decay: 4 });
        break;
      case "ethereal":
        this.filter.frequency.rampTo(5000, 2);
        this.reverb.set({ decay: 5 });
        break;
    }
  }

  getMood() { return this.mood; }
  isStarted() { return this.started; }
  getStyleName() { return this.currentStyle?.name ?? "none"; }
}
