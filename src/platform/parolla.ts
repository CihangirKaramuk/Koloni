/**
 * parolla Games SDK sarmalayıcısı. Oyunun geri kalanı SDK'yı doğrudan değil,
 * bu modül üzerinden kullanır. SDK yüklenemezse (çevrimdışı, engelli vb.)
 * oyun yine çalışır: standalone gibi davranırız.
 */
export interface ParollaUser {
  sub: string;
  name: string;
  avatar?: string;
}

export interface InitResult {
  locale: 'tr' | 'en';
  user: ParollaUser | null;
  invite?: Record<string, string> | null;
  invitedBy?: string | null;
  standalone: boolean;
}

interface ParollaSdk {
  init(): Promise<InitResult>;
  requestLogin(): Promise<void>;
  gameplayStart(): Promise<void>;
  gameplayStop(): Promise<void>;
  cloud: {
    save(key: string, value: unknown): Promise<void>;
    load<T = unknown>(key: string): Promise<T | null>;
  };
}

declare global {
  interface Window {
    ParollaGames?: ParollaSdk;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]).catch(() => fallback);
}

class Platform {
  info: InitResult = { locale: 'tr', user: null, standalone: true };
  private sdk: ParollaSdk | undefined;
  private playing = false;
  /** Reklam gösterilirken oyunu/sesi durdurmak için. */

  private initPromise: Promise<InitResult> | null = null;

  /** Birden çok kez çağrılabilir: SDK yalnızca bir kez başlatılır. */
  init(): Promise<InitResult> {
    return (this.initPromise ??= this.doInit());
  }

  private async doInit(): Promise<InitResult> {
    this.sdk = window.ParollaGames;
    const navLocale: 'tr' | 'en' = navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en';
    if (!this.sdk) {
      this.info = { locale: navLocale, user: null, standalone: true };
      return this.info;
    }
    try {
      const r = await withTimeout(this.sdk.init(), 6000, null as InitResult | null);
      this.info = r ?? { locale: navLocale, user: null, standalone: true };
    } catch {
      this.info = { locale: navLocale, user: null, standalone: true };
    }
    if (this.info.locale !== 'tr' && this.info.locale !== 'en') this.info.locale = navLocale;
    return this.info;
  }

  get user() {
    return this.info.user;
  }

  /** Aktif oynama başladı/durdu. Aynı durumu tekrar bildirmez. */
  setPlaying(on: boolean) {
    if (on === this.playing) return;
    this.playing = on;
    try {
      void (on ? this.sdk?.gameplayStart() : this.sdk?.gameplayStop())?.catch(() => {});
    } catch {
      /* SDK yoksa sessizce geç */
    }
  }

  requestLogin() {
    try {
      void this.sdk?.requestLogin()?.catch(() => {});
    } catch {
      /* yok say */
    }
  }

  async cloudLoad<T>(key: string): Promise<T | null> {
    if (!this.sdk || !this.user) return null;
    try {
      return await withTimeout(this.sdk.cloud.load<T>(key), 8000, null);
    } catch {
      return null;
    }
  }

  async cloudSave(key: string, value: unknown): Promise<boolean> {
    if (!this.sdk || !this.user) return false;
    try {
      await withTimeout(this.sdk.cloud.save(key, value), 8000, undefined);
      return true;
    } catch {
      return false;
    }
  }
}

export const platform = new Platform();
