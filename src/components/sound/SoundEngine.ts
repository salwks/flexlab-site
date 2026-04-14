import * as Tone from "tone";

// ─── Scales ───
const SCALES = {
  penta: ["C3","D3","E3","G3","A3","C4","D4","E4","G4","A4"],
  minor: ["C3","D3","Eb3","F3","G3","Ab3","Bb3","C4","D4","Eb4"],
  dorian: ["C3","D3","Eb3","F3","G3","A3","Bb3","C4","D4","Eb4"],
  whole: ["C3","D3","E3","F#3","G#3","A#3","C4","D4","E4","F#4"],
  major: ["C3","D3","E3","F3","G3","A3","B3","C4","D4","E4"],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export type Mood = "bright" | "dark" | "ethereal";

type Disposable = { dispose: () => void };

// ─── Modular building blocks ───

// RHYTHM modules
const rhythmModules = [
  // Four-on-the-floor
  (master: Tone.Gain, list: Disposable[]) => {
    const kick = new Tone.MembraneSynth({
      pitchDecay: rand(0.02, 0.06), octaves: Math.round(rand(5, 9)),
      envelope: { attack: 0.001, decay: rand(0.15, 0.35), sustain: 0, release: 0.08 },
      volume: rand(-16, -10),
    }).connect(master);
    const loop = new Tone.Loop((t) => kick.triggerAttackRelease("C1", "8n", t), "4n");
    loop.start(0);
    list.push(kick, loop);
  },
  // Half-time kick
  (master: Tone.Gain, list: Disposable[]) => {
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05, octaves: 6,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
      volume: -14,
    }).connect(master);
    const loop = new Tone.Loop((t) => kick.triggerAttackRelease("C1", "8n", t), "2n");
    loop.start(0);
    list.push(kick, loop);
  },
  // Syncopated kick
  (master: Tone.Gain, list: Disposable[]) => {
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.04, octaves: 7,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 },
      volume: -13,
    }).connect(master);
    let step = 0;
    const pattern = [1,0,0,1,0,0,1,0]; // syncopated
    const loop = new Tone.Loop((t) => {
      if (pattern[step % 8]) kick.triggerAttackRelease("C1", "8n", t);
      step++;
    }, "8n");
    loop.start(0);
    list.push(kick, loop);
  },
  // No kick (percussionless)
  () => {},
  // Broken beat
  (master: Tone.Gain, list: Disposable[]) => {
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.03, octaves: 8,
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
      volume: -12,
    }).connect(master);
    let step = 0;
    const loop = new Tone.Loop((t) => {
      if (step % 3 === 0 || step % 7 === 0) kick.triggerAttackRelease("C1", "8n", t);
      step++;
    }, "8n");
    loop.start(0);
    list.push(kick, loop);
  },
];

// HAT modules
const hatModules = [
  // Straight 8ths
  (master: Tone.Gain, list: Disposable[]) => {
    const hat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: rand(0.03, 0.06), sustain: 0, release: 0.01 },
      volume: rand(-26, -20),
    }).connect(master);
    const loop = new Tone.Loop((t) => hat.triggerAttackRelease("32n", t), "8n");
    loop.start(0);
    list.push(hat, loop);
  },
  // Random sparse clicks
  (master: Tone.Gain, list: Disposable[]) => {
    const click = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
      volume: -24,
    }).connect(master);
    const loop = new Tone.Loop((t) => {
      if (Math.random() > 0.5) click.triggerAttackRelease("32n", t);
    }, "16n");
    loop.start(0);
    list.push(click, loop);
  },
  // Shuffle shaker
  (master: Tone.Gain, list: Disposable[]) => {
    const shaker = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: rand(0.03, 0.08), sustain: 0, release: 0.01 },
      volume: -28,
    }).connect(master);
    const loop = new Tone.Loop((t) => {
      if (Math.random() > 0.3) shaker.triggerAttackRelease("32n", t);
    }, "16n");
    loop.start(0);
    list.push(shaker, loop);
  },
  // None
  () => {},
  // Clap on backbeat
  (master: Tone.Gain, list: Disposable[]) => {
    const clap = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
      volume: -20,
    }).connect(master);
    let beat = 0;
    const loop = new Tone.Loop((t) => {
      beat++;
      if (beat % 2 === 0) clap.triggerAttackRelease("16n", t);
    }, "4n");
    loop.start(0);
    list.push(clap, loop);
  },
];

// MELODY modules
const melodyModules = [
  // Sequenced — evolving 8-step
  (filter: Tone.Filter, scale: string[], list: Disposable[]) => {
    const synth = new Tone.Synth({
      oscillator: { type: pick(["triangle", "sawtooth", "square"]) as OscillatorType },
      envelope: { attack: 0.01, decay: rand(0.15, 0.4), sustain: rand(0.05, 0.2), release: rand(0.3, 0.8) },
      volume: rand(-18, -12),
    }).connect(filter);
    let step = 0;
    let pattern = Array.from({ length: 8 }, () => Math.random() > 0.3 ? pick(scale) : null);
    const loop = new Tone.Loop((t) => {
      const note = pattern[step % 8];
      if (note) synth.triggerAttackRelease(note, pick(["16n", "8n"]), t);
      step++;
      if (step % 32 === 0) {
        pattern = pattern.map((n) => Math.random() < 0.3 ? (Math.random() > 0.3 ? pick(scale) : null) : n);
      }
    }, "8n");
    loop.start(0);
    list.push(synth, loop);
  },
  // Arpeggio ascending/descending
  (filter: Tone.Filter, scale: string[], list: Disposable[]) => {
    const synth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.05, release: 0.5 },
      volume: -14,
    }).connect(filter);
    let idx = 0;
    const dir = pick([1, -1]);
    const loop = new Tone.Loop((t) => {
      synth.triggerAttackRelease(scale[Math.abs(idx % scale.length)], "16n", t);
      idx += dir;
      if (Math.random() < 0.1) idx += pick([1, 2, -1]);
    }, pick(["16n", "8n"]));
    loop.start(0);
    list.push(synth, loop);
  },
  // Pluck melody — sparse, organic
  (filter: Tone.Filter, scale: string[], list: Disposable[]) => {
    const pluck = new Tone.PluckSynth({
      attackNoise: rand(0.8, 2), dampening: rand(2000, 4000), resonance: rand(0.85, 0.97),
      volume: -14,
    }).connect(filter);
    const interval = pick(["4n", "4n.", "2n"]);
    const loop = new Tone.Loop((t) => {
      if (Math.random() > 0.2) pluck.triggerAttackRelease(pick(scale), t);
    }, interval);
    loop.start("1m");
    list.push(pluck, loop);
  },
  // FM glitch hits
  (filter: Tone.Filter, scale: string[], list: Disposable[]) => {
    const fm = new Tone.FMSynth({
      harmonicity: pick([2, 3, 5]),
      modulationIndex: pick([5, 10, 15]),
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.3 },
      modulation: { type: "square" },
      volume: -18,
    }).connect(filter);
    const loop = new Tone.Loop((t) => {
      if (Math.random() > 0.4) fm.triggerAttackRelease(pick(scale), pick(["32n","16n","8n"]), t);
    }, pick(["8n", "8n."]));
    loop.start(0);
    list.push(fm, loop);
  },
  // Piano-like melody
  (filter: Tone.Filter, scale: string[], list: Disposable[]) => {
    const piano = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 1.5 },
      volume: -16,
    }).connect(filter);
    const loop = new Tone.Loop((t) => {
      piano.triggerAttackRelease(pick(scale), pick(["8n","4n","4n."]), t);
    }, pick(["2n", "1n"]));
    loop.start("1m");
    list.push(piano, loop);
  },
];

// BASS modules
const bassModules = [
  // Sub sine
  (master: Tone.Gain, scale: string[], list: Disposable[]) => {
    const sub = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.02, decay: 0.6, sustain: 0.3, release: 1.5 },
      volume: rand(-18, -12),
    }).connect(master);
    const loop = new Tone.Loop((t) => {
      sub.triggerAttackRelease(pick(scale.slice(0, 3)), pick(["4n","2n"]), t);
    }, pick(["1n", "2n."]));
    loop.start("1m");
    list.push(sub, loop);
  },
  // Mono bass with filter
  (master: Tone.Gain, scale: string[], list: Disposable[]) => {
    const bass = new Tone.MonoSynth({
      oscillator: { type: "square" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5, baseFrequency: 200, octaves: 2 },
      volume: -14,
    }).connect(master);
    const loop = new Tone.Loop((t) => {
      bass.triggerAttackRelease(pick(scale.slice(0, 3)), "4n", t);
    }, "2n");
    loop.start(0);
    list.push(bass, loop);
  },
  // Drone
  (master: Tone.Gain, scale: string[], list: Disposable[]) => {
    const drone = new Tone.Synth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 4, decay: 2, sustain: 0.5, release: 5 },
      volume: -28,
    }).connect(master);
    const loop = new Tone.Loop((t) => {
      drone.triggerAttackRelease(pick(scale.slice(0, 2)), "1n", t);
    }, pick(["4m", "3m"]));
    loop.start("2m");
    list.push(drone, loop);
  },
  // None
  () => {},
];

// TEXTURE modules
const textureModules = [
  // Pad chords
  (filter: Tone.Filter, scale: string[], list: Disposable[]) => {
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: rand(1, 3), decay: 0.5, sustain: 0.3, release: rand(2, 4) },
      volume: rand(-26, -20),
    }).connect(filter);
    const loop = new Tone.Loop((t) => {
      pad.triggerAttackRelease(pick(scale), "1n", t, 0.25);
    }, pick(["2m", "4m"]));
    loop.start(0);
    list.push(pad, loop);
  },
  // Noise wash
  (filter: Tone.Filter, _scale: string[], list: Disposable[]) => {
    const noise = new Tone.NoiseSynth({
      noise: { type: pick(["brown", "pink"]) as "brown" | "pink" },
      envelope: { attack: rand(0.5, 2), decay: 1, sustain: 0.2, release: 2 },
      volume: -30,
    }).connect(filter);
    const loop = new Tone.Loop((t) => noise.triggerAttackRelease("4n", t), pick(["3m", "5m"]));
    loop.start("2m");
    list.push(noise, loop);
  },
  // Bell layer
  (filter: Tone.Filter, scale: string[], list: Disposable[]) => {
    const bell = new Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.002, decay: 1.5, sustain: 0, release: 2 },
      volume: -20,
    }).connect(filter);
    const i1 = rand(3, 6);
    const i2 = rand(5, 9);
    const l1 = new Tone.Loop((t) => bell.triggerAttackRelease(pick(scale.slice(5)), "8n", t), i1);
    const l2 = new Tone.Loop((t) => bell.triggerAttackRelease(pick(scale.slice(3, 7)), "4n", t), i2);
    l1.start(0);
    l2.start(1);
    list.push(bell, l1, l2);
  },
  // None
  () => {},
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
  disposables: Disposable[] = [];

  async start() {
    if (this.started) return;
    await Tone.start();

    // BPM
    Tone.getTransport().bpm.value = Math.round(rand(70, 135));

    // Master chain
    this.master = new Tone.Gain(rand(0.35, 0.5)).toDestination();
    this.reverb = new Tone.Reverb({ decay: rand(1.5, 4), wet: rand(0.2, 0.4) }).connect(this.master);
    this.delay = new Tone.FeedbackDelay({
      delayTime: pick([0.15, 0.2, 0.25, 0.3]),
      feedback: rand(0.1, 0.25),
      wet: rand(0.1, 0.2),
    }).connect(this.reverb);
    this.filter = new Tone.Filter({
      frequency: rand(2500, 5000),
      type: "lowpass",
    }).connect(this.delay);

    // Interaction pluck
    this.pluckSynth = new Tone.PluckSynth({
      attackNoise: 1.5, dampening: 3000, resonance: 0.95, volume: -10,
    }).connect(this.filter);

    // Pick random scale
    const scaleKey = pick(Object.keys(SCALES)) as keyof typeof SCALES;
    const scale = SCALES[scaleKey];

    // Assemble random combination
    pick(rhythmModules)(this.master, this.disposables);
    pick(hatModules)(this.master, this.disposables);
    pick(melodyModules)(this.filter, scale, this.disposables);
    pick(bassModules)(this.master, scale, this.disposables);
    pick(textureModules)(this.filter, scale, this.disposables);

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
    const scale = SCALES.penta;
    this.pluckSynth.triggerAttackRelease(scale[index % scale.length], "8n", now);
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
}
