import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Yalnızca geliştirme: tools/gallery.html'deki "Projeye kaydet" butonu üretilen
 * bölüm resimlerini src/level/art/generated.ts dosyasına, tools/cover.html ise
 * kapağı docs/kapak.png dosyasına yazar.
 */
function saveGenerated(): Plugin {
  return {
    name: 'koloni-save-generated',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save-generated', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          if (!body.startsWith('// OTOMATİK ÜRETİLDİ')) {
            res.statusCode = 400;
            res.end('beklenmeyen içerik');
            return;
          }
          writeFileSync(resolve(import.meta.dirname, 'src/level/art/generated.ts'), body, 'utf8');
          res.end('ok');
        });
      });
      // tools/cover.html "Projeye kaydet": kapak PNG'sini docs/kapak.png olarak yazar.
      server.middlewares.use('/__save-cover', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          const prefix = 'data:image/png;base64,';
          if (!body.startsWith(prefix)) {
            res.statusCode = 400;
            res.end('beklenmeyen içerik');
            return;
          }
          writeFileSync(resolve(import.meta.dirname, 'docs/kapak.png'), Buffer.from(body.slice(prefix.length), 'base64'));
          res.end('ok');
        });
      });
    },
  };
}

// base: './' → build her alt klasörde / her hosting'de göreli yollarla çalışır.
export default defineConfig({
  base: './',
  plugins: [saveGenerated()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
  server: { port: 5173 },
});
