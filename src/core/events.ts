/** Küçük, tip güvenli olay yayıcı. Çekirdek olayları dışarıya (çizim, ses, arayüz) bununla duyurur. */
export class Emitter<E extends Record<string, unknown>> {
  private handlers: { [K in keyof E]?: ((p: E[K]) => void)[] } = {};

  on<K extends keyof E>(type: K, fn: (p: E[K]) => void): () => void {
    (this.handlers[type] ??= []).push(fn);
    return () => {
      this.handlers[type] = this.handlers[type]?.filter((f) => f !== fn);
    };
  }

  emit<K extends keyof E>(type: K, payload: E[K]): void {
    this.handlers[type]?.forEach((fn) => fn(payload));
  }
}
