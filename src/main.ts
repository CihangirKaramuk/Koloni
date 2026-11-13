import './ui/styles.css';
import { App } from './app';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;

// Yazı tipleri yüklenmeden canvas'a yazı çizmeyelim (en fazla 1.5 sn bekle).
const fontsReady = Promise.race([
  Promise.all([document.fonts.load('40px "Lilita One"'), document.fonts.load('800 20px "Baloo 2"')]).catch(() => {}),
  new Promise((r) => setTimeout(r, 1500)),
]);
void fontsReady.then(() => new App(canvas, ui).start());
