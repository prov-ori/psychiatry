/* Генератор фирменного знака: симметричное чернильное пятно (тест Роршаха, 1921).
   Рисует пятно цветом ink на прозрачном фоне. compact (0..1) — насколько знак собран в одну массу. */
function seeded(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

function drawBrandBlot(ctx, x0, y0, W, H, seed, ink, opts = {}) {
  const compact = opts.compact ?? 0.6;
  const splatter = opts.splatter ?? 8;
  const rnd = seeded(seed);
  const blobs = [];
  const n = 22 + Math.floor(rnd() * 10);
  for (let i = 0; i < n; i++) {
    const spread = Math.pow(rnd(), 0.9 + compact);
    blobs.push({ x: spread * W * 0.36, y: H * (0.14 + rnd() * 0.72), s: (0.03 + Math.pow(rnd(), 1.4) * 0.07) * W, w: 0.45 + rnd() * 0.5 });
  }
  for (let i = 0; i < splatter; i++) { const sp = { x: W * (0.12 + rnd() * 0.3), y: H * (0.08 + rnd() * 0.84), s: (0.006 + rnd() * 0.008) * W, w: 1.3 }; if (!opts.hideSplatter) blobs.push(sp); }
  const f1 = (0.02 + rnd() * 0.03) * 480 / W, f2 = (0.03 + rnd() * 0.04) * 480 / W, ph = rnd() * 6.28;
  const c = document.createElement('canvas').getContext('2d');
  c.fillStyle = ink; c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  const img = ctx.createImageData(W, H);
  const cx = W / 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = Math.abs(x - cx);
    let v = 0;
    for (const bl of blobs) { const ex = dx - bl.x, ey = y - bl.y; v += bl.w * Math.exp(-(ex * ex + ey * ey) / (2 * bl.s * bl.s)); }
    v += 0.1 * Math.sin(dx * f1 + ph) * Math.cos(y * f2 - ph) + 0.05 * Math.sin(dx * f2 * 2.7 + y * f1 * 3.1);
    const a = Math.min(1, Math.max(0, (v - 0.55) / (opts.edge ?? 0.025)));
    const k = (y * W + x) * 4;
    img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = Math.round(a * 255);
  }
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
  tmp.getContext('2d').putImageData(img, 0, 0);
  ctx.drawImage(tmp, x0, y0);
}
