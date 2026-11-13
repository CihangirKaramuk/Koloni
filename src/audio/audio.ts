/**
 * Ses yöneticisi. public/sfx/ altına <ad>.ogg (veya .mp3) konursa o dosya çalınır;
 * yoksa ya da tarayıcı çözemezse küçük, kodla üretilmiş bir yedek ses kullanılır.
 * Şu anki dosyalar: Kenney CC0 paketleri (docs/SESLER.md, docs/licenses/).
 * Piksel alma sesi ve müzik bilerek kodla üretilir (yumuşak, dosyasız).
 */
import { Music } from './music';

/**
 * Hazır müzik dosyası kullanmak istersen public/sfx/ altına koyup yolunu buraya yaz
 * (ör. 'sfx/music.ogg'); null iken kodla üretilen müzik (music.ts) çalar.
 */
const MUSIC_FILE: string | null = null;
export type SfxName = 'tap' | 'eat' | 'clear' | 'blocked' | 'slotDone' | 'win' | 'lose' | 'burn' | 'button' | 'thaw';

// 'eat' / 'clear' (piksel alma) dosyadan değil, yumuşak sentez sesle çalar.
const FILE_SOUNDS: SfxName[] = ['tap', 'blocked', 'slotDone', 'win', 'lose', 'burn', 'button', 'thaw'];
/** Dosya seslerinin ses seviyesi. */
const VOLUME: Partial<Record<SfxName, number>> = { tap: 0.8, button: 0.7 };
/** Piksel alma sesinin notaları: Do majör pentatonik (müzikle uyumlu), yüksek oktav. */
const PICK_NOTES = [1047, 1175, 1319, 1568, 1760, 2093];

class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private lastPlay = new Map<string, number>();
  private music: { el: HTMLAudioElement } | null = null;
  private synthMusic = new Music();
  sfxOn = true;
  /** Yüklenen dosya sesleri (test / hata ayıklama için). */
  get loaded(): string[] {
    return [...this.buffers.keys()];
  }
  musicOn = true;

  /** İlk kullanıcı dokunuşunda çağrılır (tarayıcı otomatik oynatma kuralı). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    void this.loadFiles();
    this.startMusic();
  }

  /** Müzik zinciri hazırsa aç/kapat (dosya ya da kodla üretilen). */
  private applyMusic() {
    if (MUSIC_FILE) return;
    this.synthMusic.setOn(this.musicOn);
  }

  private async loadFiles() {
    for (const name of FILE_SOUNDS) {
      for (const ext of ['ogg', 'mp3']) {
        try {
          const res = await fetch(`sfx/${name}.${ext}`);
          if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('audio')) continue;
          const buf = await this.ctx!.decodeAudioData(await res.arrayBuffer());
          this.buffers.set(name, buf);
          break;
        } catch {
          /* dosya yok → yedek ses */
        }
      }
    }
  }

  private startMusic() {
    if (!MUSIC_FILE) {
      this.synthMusic.attach(this.ctx!);
      this.applyMusic();
      return;
    }
    if (this.music) return;
    const el = new window.Audio(MUSIC_FILE);
    el.loop = true;
    el.volume = 0.35;
    el.addEventListener('error', () => (this.music = null));
    this.music = { el };
    if (this.musicOn) void el.play().catch(() => {});
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    this.applyMusic();
    if (!this.music) return;
    if (on) void this.music.el.play().catch(() => {});
    else this.music.el.pause();
  }

  suspend() {
    void this.ctx?.suspend();
    this.music?.el.pause();
  }

  resume() {
    void this.ctx?.resume();
    if (this.musicOn) void this.music?.el.play().catch(() => {});
  }

  play(name: SfxName, opts: { pitch?: number } = {}) {
    if (!this.sfxOn || !this.ctx || !this.master || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    // Aynı sesi çok sık çalma (yüzlerce karınca aynı anda piksel alabilir).
    const pick = name === 'eat' || name === 'clear';
    const key = pick ? 'pick' : name;
    const minGap = pick ? 0.075 : 0.02;
    if (now - (this.lastPlay.get(key) ?? -1) < minGap) return;
    this.lastPlay.set(key, now);
    if (pick) {
      this.softPick(now);
      return;
    }
    const buf = this.buffers.get(name);
    if (buf) {
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = opts.pitch ?? 1;
      const g = this.ctx.createGain();
      g.gain.value = VOLUME[name] ?? 1;
      src.connect(g).connect(this.master);
      src.start();
      return;
    }
    this.synth(name, now, opts.pitch ?? 1);
  }

  /** Piksel alma: çok kısık, yumuşak, kalimba benzeri kısa "tık". */
  private softPick(t: number) {
    const ctx = this.ctx!;
    const f = PICK_NOTES[Math.floor(Math.random() * PICK_NOTES.length)];
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + 0.18);
  }

  private tone(t: number, freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private noise(t: number, dur: number, vol: number, freq: number) {
    const ctx = this.ctx!;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(this.master!);
    src.start(t);
  }

  private synth(name: SfxName, t: number, p: number) {
    switch (name) {
      case 'tap':
        this.tone(t, 520 * p, 0.09, 'triangle', 0.35, 780 * p);
        break;
      case 'button':
        this.tone(t, 660, 0.06, 'triangle', 0.25, 880);
        break;
      case 'blocked':
        this.tone(t, 180, 0.14, 'square', 0.12, 130);
        break;
      case 'slotDone':
        this.tone(t, 700 * p, 0.08, 'triangle', 0.22, 1050 * p);
        break;
      case 'thaw':
        this.tone(t, 1400, 0.12, 'sine', 0.15, 2100);
        break;
      case 'burn':
        this.noise(t, 0.35, 0.4, 600);
        this.tone(t, 220, 0.3, 'sawtooth', 0.06, 90);
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(t + i * 0.1, f, 0.22, 'triangle', 0.3));
        break;
      case 'lose':
        [392, 330, 262].forEach((f, i) => this.tone(t + i * 0.14, f, 0.25, 'triangle', 0.25));
        break;
    }
  }
}

export const audio = new Audio();
