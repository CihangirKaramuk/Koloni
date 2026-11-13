/**
 * Kodla üretilen arka plan müziği: yavaş (84 BPM), tatlı, kalimba tınılı bir döngü.
 * Dosya yok; Web Audio ile çalınır. Akorlar: C – Am – F – G – C – Em – F – G (8 ölçü, ~23 sn).
 * Melodiyi / akorları değiştirmek için MELODY ve CHORDS dizilerini düzenle.
 */

const BPM = 84;
const EIGHTH = 60 / BPM / 2;

/** Ölçü başına 8 sekizlik; null = es. MIDI nota numaraları (60 = Do4). */
const MELODY: (number | null)[][] = [
  [76, null, 79, null, 81, 79, 76, null],
  [72, null, 76, null, 74, 72, 69, null],
  [69, null, 72, null, 74, null, 72, 69],
  [67, null, 71, null, 74, null, null, null],
  [76, null, 79, null, 84, null, 81, 79],
  [79, null, 76, null, 74, 76, null, null],
  [72, null, 74, null, 76, null, 79, null],
  [74, null, 71, null, 72, null, null, null],
];

/** Her ölçünün akoru ve bas notası. */
const CHORDS: { notes: number[]; bass: number }[] = [
  { notes: [60, 64, 67], bass: 48 }, // C
  { notes: [57, 60, 64], bass: 45 }, // Am
  { notes: [53, 57, 60], bass: 41 }, // F
  { notes: [55, 59, 62], bass: 43 }, // G
  { notes: [60, 64, 67], bass: 48 }, // C
  { notes: [52, 55, 59], bass: 40 }, // Em
  { notes: [53, 57, 60], bass: 41 }, // F
  { notes: [55, 59, 62], bass: 43 }, // G
];

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export class Music {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextTime = 0;
  private on = false;
  /** Genel müzik seviyesi (efektlerin altında kalsın). */
  volume = 0.16;

  /** Müzik zincirini kur: yumuşak alçak geçiren filtre + hafif yankı. */
  attach(ctx: AudioContext) {
    if (this.ctx) return;
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = EIGHTH * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.22;
    const wet = ctx.createGain();
    wet.gain.value = 0.2;
    this.out.connect(lp);
    lp.connect(ctx.destination);
    lp.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(ctx.destination);
  }

  setOn(on: boolean) {
    if (!this.ctx || !this.out) {
      this.on = on;
      return;
    }
    if (on === this.on && (on ? this.timer : !this.timer)) return;
    this.on = on;
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    if (on) {
      this.out.gain.linearRampToValueAtTime(this.volume, t + 1.5);
      this.step = 0;
      this.nextTime = t + 0.1;
      this.timer = setInterval(() => this.schedule(), 50);
    } else {
      this.out.gain.linearRampToValueAtTime(0, t + 0.4);
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Önümüzdeki ~0,25 saniyenin notalarını zamanla (Web Audio zamanlayıcısı, takılmasız). */
  private schedule() {
    const ctx = this.ctx!;
    // Sekme arka plandayken bağlam durur; geri gelince birikmiş notaları çalma.
    if (this.nextTime < ctx.currentTime - 0.5) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.25) {
      this.playStep(this.step, this.nextTime);
      this.step = (this.step + 1) % (MELODY.length * 8);
      this.nextTime += EIGHTH;
    }
  }

  private playStep(step: number, t: number) {
    const bar = Math.floor(step / 8);
    const pos = step % 8;
    const chord = CHORDS[bar];
    if (pos === 0) this.pad(t, chord.notes, EIGHTH * 8);
    if (pos === 0 || pos === 4) this.bass(t, chord.bass, EIGHTH * 3.5);
    const note = MELODY[bar][pos];
    if (note !== null) this.pluck(t, note, pos % 2 === 0 ? 0.11 : 0.08);
    // Çok hafif, ara vuruşlarda yumuşak "şıkırtı"
    if (pos % 2 === 1) this.shaker(t);
  }

  /** Kalimba benzeri tını: temel + parlak üst ses, hızlı sönüm. */
  private pluck(t: number, midi: number, vol: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    g.connect(this.out!);
    const f = hz(midi);
    for (const [mult, v] of [[1, 1], [4.02, 0.12]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mult;
      const og = ctx.createGain();
      og.gain.value = v;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + 1.2);
    }
  }

  /** Yumuşak akor dolgusu: yavaş giriş, yavaş çıkış. */
  private pad(t: number, notes: number[], dur: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.6);
    g.gain.setValueAtTime(0.035, t + dur - 0.4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
    g.connect(this.out!);
    for (const n of notes) {
      for (const det of [-6, 6]) {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = hz(n);
        o.detune.value = det;
        o.connect(g);
        o.start(t);
        o.stop(t + dur + 0.7);
      }
    }
  }

  private bass(t: number, midi: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private shakerBuf: AudioBuffer | null = null;
  private shaker(t: number) {
    const ctx = this.ctx!;
    if (!this.shakerBuf) {
      const len = Math.floor(ctx.sampleRate * 0.05);
      this.shakerBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.shakerBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.shakerBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const g = ctx.createGain();
    g.gain.value = 0.025;
    src.connect(hp).connect(g).connect(this.out!);
    src.start(t);
  }
}
