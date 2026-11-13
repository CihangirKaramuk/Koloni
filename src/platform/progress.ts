import { platform } from './parolla';

/** Oyuncu ilerlemesi. Misafirde localStorage'da, girişli oyuncuda ayrıca bulutta. */
export interface Progress {
  v: 1;
  /** Açılmış en yüksek bölüm. */
  unlocked: number;
  /** Bölüm → en iyi yıldız (1..3). */
  stars: Record<string, number>;
  boosters: { slot: number; gun: number; hand: number; rainbow: number };
  /** Altın bakiyesi. */
  coins: number;
  /** Hızlı karıncalar gücünden kalan süre (sn). Sadece oynarken azalır. */
  speedLeft: number;
  /** Hız gücü açık mı? Kapalıyken süre akmaz, sonra kaldığı yerden devam eder. */
  speedOn: boolean;
  /** Can sayısı (0..maxLives). */
  lives: number;
  /** Bir sonraki can yenilenmesinin sayılmaya başladığı an (ms). */
  livesTs: number;
  /** Sınırsız can bitiş anı (ms). */
  unlimitedUntil: number;
  /** Günlük ödül: son alınan gün (YYYY-MM-DD, yerel) ve seri günü (1..7). */
  daily: { last: string; streak: number };
  settings: { sfx: boolean; music: boolean; fast: boolean; vibrate: boolean };
  /** Görülen tanıtım ipuçları. */
  tips: string[];
  updatedAt: number;
}

/**
 * Test kumu: adres ?sandbox=1 ile açılınca oyun ayrı bir kayıt alanı kullanır ve buluta
 * yazmaz. Geliştirme sırasındaki denemeler oyuncunun gerçek ilerlemesine dokunmaz.
 */
const SANDBOX = typeof location !== 'undefined' && new URLSearchParams(location.search).has('sandbox');
const LOCAL_KEY = SANDBOX ? 'koloni.progress.sandbox' : 'koloni.progress.v1';
const CLOUD_KEY = 'progress';

export function freshProgress(): Progress {
  return {
    v: 1,
    unlocked: 1,
    stars: {},
    boosters: { slot: 1, gun: 1, hand: 1, rainbow: 1 },
    coins: 200,
    // Yeni oyuncu: her güçten bir tane + 3 dakikalık hız (kapalı başlar, oyuncu açar).
    speedLeft: 180,
    speedOn: false,
    lives: 5,
    livesTs: 0,
    unlimitedUntil: 0,
    daily: { last: '', streak: 0 },
    settings: { sfx: true, music: true, fast: false, vibrate: true },
    tips: [],
    updatedAt: 0,
  };
}

function sanitize(p: Partial<Progress> | null | undefined): Progress | null {
  if (!p || typeof p !== 'object' || p.v !== 1) return null;
  const f = freshProgress();
  return {
    ...f,
    ...p,
    boosters: { ...f.boosters, ...(p.boosters ?? {}) },
    settings: { ...f.settings, ...(p.settings ?? {}) },
    daily: { ...f.daily, ...(p.daily ?? {}) },
    stars: { ...(p.stars ?? {}) },
    tips: Array.isArray(p.tips) ? p.tips : [],
  };
}

/** İki kaydı birleştirir: ilerleme hiçbir zaman geri gitmez, ayarlar daha yeni olandan. */
export function mergeProgress(a: Progress | null, b: Progress | null): Progress {
  if (!a) return b ?? freshProgress();
  if (!b) return a;
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  const stars: Record<string, number> = { ...a.stars };
  for (const [k, v] of Object.entries(b.stars)) stars[k] = Math.max(stars[k] ?? 0, v);
  return {
    ...newer,
    unlocked: Math.max(a.unlocked, b.unlocked),
    stars,
    tips: [...new Set([...a.tips, ...b.tips])],
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

function readLocal(): Progress | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? sanitize(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocal(p: Progress) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
  } catch {
    /* gizli sekme vb. */
  }
}

class ProgressStore {
  data: Progress = freshProgress();
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** init() sonrası çağır: yerel + bulut birleştirilir, yeni bulut verisi asla ezilmez. */
  async load(): Promise<Progress> {
    const local = readLocal();
    let merged = local ?? freshProgress();
    if (platform.user && !SANDBOX) {
      const cloud = sanitize(await platform.cloudLoad<Progress>(CLOUD_KEY));
      merged = mergeProgress(local, cloud);
      const cloudBehind = !cloud || cloud.unlocked < merged.unlocked || cloud.updatedAt < merged.updatedAt;
      if (cloudBehind) void platform.cloudSave(CLOUD_KEY, merged);
    }
    this.data = merged;
    writeLocal(merged);
    return merged;
  }

  /** Değiştir ve (gecikmeli) kaydet. */
  update(fn: (p: Progress) => void, immediate = false) {
    fn(this.data);
    this.data.updatedAt = Date.now();
    writeLocal(this.data);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), immediate ? 0 : 2000);
  }

  flush() {
    this.timer = null;
    if (platform.user && !SANDBOX) void platform.cloudSave(CLOUD_KEY, this.data);
  }
}

export const progress = new ProgressStore();
