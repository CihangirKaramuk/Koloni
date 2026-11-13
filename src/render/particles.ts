/** Basit parçacık sistemi: kırıntılar, konfeti, yazı balonları. Ekran pikseli biriminde. */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: 'crumb' | 'confetti' | 'text' | 'ring';
  text?: string;
  rot: number;
  vr: number;
}

const MAX_CRUMBS = 260;

export class Particles {
  list: Particle[] = [];

  crumbs(x: number, y: number, color: string, size: number, n = 5) {
    // Yüzlerce karınca aynı anda yerken kırıntı sayısı sınırsız büyümesin.
    if (this.list.length > MAX_CRUMBS) return;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 90;
      this.list.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        life: 0, max: 0.45 + Math.random() * 0.3,
        size: size * (0.25 + Math.random() * 0.25), color, kind: 'crumb',
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12,
      });
    }
  }

  confetti(w: number, h: number, colors: string[], n = 90) {
    for (let i = 0; i < n; i++) {
      this.list.push({
        x: Math.random() * w, y: -20 - Math.random() * h * 0.4,
        vx: (Math.random() - 0.5) * 80, vy: 120 + Math.random() * 160,
        life: 0, max: 2.4 + Math.random(), size: 6 + Math.random() * 6,
        color: colors[i % colors.length], kind: 'confetti',
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10,
      });
    }
  }

  text(x: number, y: number, text: string, color = '#fff', size = 20) {
    this.list.push({ x, y, vx: 0, vy: -50, life: 0, max: 1.1, size, color, kind: 'text', text, rot: 0, vr: 0 });
  }

  ring(x: number, y: number, size: number, color = '#fff') {
    this.list.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.4, size, color, kind: 'ring', rot: 0, vr: 0 });
  }

  update(dt: number) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life += dt;
      if (p.life >= p.max) {
        // Sırası önemsiz: sonuncuyu buraya taşı (splice'tan çok daha ucuz).
        this.list[i] = this.list[this.list.length - 1];
        this.list.pop();
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'crumb') p.vy += 420 * dt;
      if (p.kind === 'confetti') p.vx += Math.sin(p.life * 4 + p.rot) * 30 * dt;
      p.rot += p.vr * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D, font: string, outline: string) {
    for (const p of this.list) {
      const k = p.life / p.max;
      ctx.save();
      ctx.globalAlpha = p.kind === 'confetti' ? 1 : 1 - k * k;
      ctx.translate(p.x, p.y);
      if (p.kind === 'text') {
        ctx.font = `800 ${p.size}px ${font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = p.size * 0.22;
        ctx.strokeStyle = outline;
        ctx.strokeText(p.text!, 0, 0);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text!, 0, 0);
      } else if (p.kind === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4 * (1 - k);
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (0.5 + k * 0.6), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        const s = p.size;
        ctx.fillRect(-s / 2, -s / (p.kind === 'confetti' ? 4 : 2), s, p.kind === 'confetti' ? s / 2 : s);
      }
      ctx.restore();
    }
  }
}
