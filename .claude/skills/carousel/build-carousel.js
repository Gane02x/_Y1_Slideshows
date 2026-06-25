const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname);
const config = JSON.parse(fs.readFileSync(path.join(BASE, 'config.json'), 'utf8'));

// Load fonts as base64
const F_LIGHT  = fs.readFileSync(path.join(BASE, 'assets/fonts/TWKEverett-Light.ttf')).toString('base64');
const F_MEDIUM = fs.readFileSync(path.join(BASE, 'assets/fonts/TWKEverett-Medium.ttf')).toString('base64');
const F_MONO   = fs.readFileSync(path.join(BASE, 'assets/fonts/TWKEverettMono-Medium.ttf')).toString('base64');

// Light mode: dark logo on light background
const LOGO_B64 = Buffer.from(fs.readFileSync(path.join(BASE, 'assets/y1-logo.svg'), 'utf8')).toString('base64');

// Peace-hand icon recolored to dark text color
const PEACE_HAND_B64 = Buffer.from(
  fs.readFileSync(path.join(BASE, 'assets/icons/peace-hand.svg'), 'utf8')
    .replace(/stroke="#[0-9a-fA-F]{3,6}"/g, 'stroke="#000000"')
).toString('base64');

const W   = config.slideSize.width;
const H   = config.slideSize.height;
const PAD = 64;
const BG  = config.colors.bg;
const FG  = config.colors.text;
const ACC = config.colors.accent;
const HANDLE = config.handle;

const FONT_DEFS = `
  @font-face{font-family:'TWKEverett';font-weight:300;src:url('data:font/truetype;base64,${F_LIGHT}');}
  @font-face{font-family:'TWKEverett';font-weight:500;src:url('data:font/truetype;base64,${F_MEDIUM}');}
  @font-face{font-family:'TWKEverettMono';font-weight:500;src:url('data:font/truetype;base64,${F_MONO}');}
`;

// ─── Asset loaders ────────────────────────────────────────────────────────────

function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

// Fixes filenames where ZIP extraction mangled umlauts (ä/ü/ö → garbled bytes)
function fixEncoding(filename) {
  let hex = Buffer.from(filename).toString('hex');
  hex = hex.replace(/e2949cc3b1/g, 'c3a4');   // ä
  hex = hex.replace(/e2949ce2959d/g, 'c3bc');  // ü
  hex = hex.replace(/e2949ce295a2/g, 'c3b6');  // ö
  return Buffer.from(hex, 'hex').toString('utf8');
}

function loadIllustration(name, type) {
  const dir = path.join(BASE, `assets/illustrations-${type}`);
  let p = path.join(dir, `${name}.png`);
  if (!fs.existsSync(p)) {
    const target = `${name}.png`;
    const match = fs.readdirSync(dir).find(f => fixEncoding(f) === target);
    if (!match) return null;
    p = path.join(dir, match);
  }
  const buf = fs.readFileSync(p);
  const { w: pw, h: ph } = pngSize(buf);
  return { b64: buf.toString('base64'), pw, ph };
}

function fitBox(pw, ph, maxW, maxH) {
  const scale = Math.min(maxW / pw, maxH / ph);
  return { w: Math.round(pw * scale), h: Math.round(ph * scale) };
}

function svgIllustration(slide) {
  if (!slide.illustration) return '';
  const type = slide.illustrationType || (slide.isHook ? 'fein' : 'grob');
  const il = loadIllustration(slide.illustration, type);
  if (!il) return `<!-- illustration "${slide.illustration}" not found -->`;
  const data = `data:image/png;base64,${il.b64}`;

  if (slide.isHook) {
    const { w, h } = fitBox(il.pw, il.ph, 700, 700);
    const x = Math.round((W - w) / 2);
    const y = H - PAD - h;
    return `<image href="${data}" x="${x}" y="${y}" width="${w}" height="${h}" opacity="0.9"/>`;
  } else {
    const { w, h } = fitBox(il.pw, il.ph, 320, 320);
    const x = W - w - 16;
    const y = H - PAD - h - 20;
    return `<image href="${data}" x="${x}" y="${y}" width="${w}" height="${h}" opacity="0.88"/>`;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseHeadline(html) {
  const lines = html.split(/<br\s*\/?>/i).map(l => l.trimStart());
  return lines.map(line => {
    const segs = [];
    const rx = /<span[^>]*class=["']accent["'][^>]*>(.*?)<\/span>/gi;
    let last = 0, m;
    while ((m = rx.exec(line)) !== null) {
      if (m.index > last) segs.push({ text: line.slice(last, m.index).replace(/<[^>]+>/g,''), accent: false });
      segs.push({ text: m[1].replace(/<[^>]+>/g,''), accent: true });
      last = m.index + m[0].length;
    }
    const tail = line.slice(last).replace(/<[^>]+>/g,'');
    if (tail) segs.push({ text: tail, accent: false });
    return segs;
  }).filter(s => s.some(p => p.text.trim()));
}

function parseTerminal(html) {
  const lines = [];
  const lineRx = /<div[^>]*class=["']t-line["'][^>]*>([\s\S]*?)<\/div>/gi;
  let m;
  while ((m = lineRx.exec(html)) !== null) {
    lines.push(parseTerminalLine(m[1]));
  }
  if (lines.length === 0) {
    html.split('\n').filter(l => l.trim()).forEach(l => lines.push(parseTerminalLine(l)));
  }
  return lines;
}

function parseTerminalLine(html) {
  const parts = [];
  const spanRx = /<span[^>]*class=["']([^"']+)["'][^>]*>([\s\S]*?)<\/span>/gi;
  let last = 0, m;
  while ((m = spanRx.exec(html)) !== null) {
    const before = html.slice(last, m.index).replace(/<[^>]+>/g,'');
    if (before.trim()) parts.push({ text: before, type: 'text' });
    parts.push({ text: m[2].replace(/<[^>]+>/g,''), type: m[1].trim().split(/\s+/)[0] });
    last = m.index + m[0].length;
  }
  const tail = html.slice(last).replace(/<[^>]+>/g,'');
  if (tail.trim()) parts.push({ text: tail, type: 'text' });
  return parts;
}

// ─── SVG building blocks ──────────────────────────────────────────────────────

function svgHeader() {
  return `
<!-- Footer -->
<image href="data:image/svg+xml;base64,${LOGO_B64}" x="${PAD}" y="${H - PAD - 68}" width="168" height="68"/>
<text x="${W / 2}" y="${H - PAD - 29}" font-family="TWKEverettMono" font-weight="500" font-size="16"
      fill="${FG}" opacity="0.7" text-anchor="middle" dominant-baseline="auto">${esc(HANDLE.toUpperCase())}</text>`;
}

function svgHookHeader() {
  return `
<!-- Logo upper right -->
<image href="data:image/svg+xml;base64,${LOGO_B64}" x="${W - PAD - 168}" y="${PAD}" width="168" height="68"/>`;
}


// Y1 style guide: letter-spacing -1px on headlines
function svgHeadline(lines, x, startY, fontSize) {
  const lineH = Math.round(fontSize * 1.08);
  return lines.map((segs, i) => {
    const y = startY + i * lineH;
    const tspans = segs.map(s =>
      `<tspan font-weight="${s.accent ? 500 : 300}" fill="${s.accent ? ACC : FG}">${esc(s.text)}</tspan>`
    ).join('');
    return `<text x="${x}" y="${y}" font-family="TWKEverett" font-size="${fontSize}" letter-spacing="-1"
      xml:space="preserve" dominant-baseline="auto">${tspans}</text>`;
  }).join('\n');
}

// Word-wraps subline at maxW
function wrapSublineText(text, fontSize, maxW) {
  const charW = fontSize * 0.62;
  const maxChars = Math.floor(maxW / charW);
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (test.length <= maxChars) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function svgSubline(text, x, y) {
  const lineH = 38;
  const wrappedLines = wrapSublineText(text, 24, 784);
  return wrappedLines.map((line, i) =>
    `<text x="${x}" y="${y + i * lineH}" font-family="TWKEverettMono" font-weight="500" font-size="24"
      fill="${FG}" opacity="0.7" letter-spacing="0" dominant-baseline="auto">${esc(line)}</text>`
  ).join('\n');
}

// Y1 Pixel Headline: pink square dot + pink mono text
function svgPixelHeadline(text, x, y, fontSize = 12, dotSize = 6) {
  const gap = 8;
  const dotTop = Math.round(y - fontSize * 0.35 - dotSize / 2);
  return `<rect x="${x}" y="${dotTop}" width="${dotSize}" height="${dotSize}" fill="${ACC}"/>
<text x="${x + dotSize + gap}" y="${y}" font-family="TWKEverettMono" font-weight="500" font-size="${fontSize}"
      fill="${ACC}" letter-spacing="0" dominant-baseline="auto">${esc(text.toUpperCase())}</text>`;
}

// Centered pixel headline — group-centered with text-anchor:start so dot never overlaps text
function svgPixelHeadlineCentered(text, y, fontSize = 12, dotSize = 6) {
  const gap = 8;
  const dotTop = Math.round(y - fontSize * 0.35 - dotSize / 2);
  const charW = fontSize * 0.62;
  const textW = text.length * charW;
  const totalW = dotSize + gap + textW;
  const startX = Math.round((W - totalW) / 2) - (dotSize + gap);
  return `<rect x="${startX}" y="${dotTop}" width="${dotSize}" height="${dotSize}" fill="${ACC}"/>
<text x="${startX + dotSize + gap}" y="${y}" font-family="TWKEverettMono" font-weight="500" font-size="${fontSize}"
      fill="${ACC}" letter-spacing="0" dominant-baseline="auto">${esc(text.toUpperCase())}</text>`;
}

// White surface box on light background
// Word-wraps a parsed terminal line into visual rows.
// Continuation rows start with {type:'spacer',w:N} aligned under the wrapping part.
function wrapLine(parts, maxW) {
  const CW = { cmd: 19.8, prompt: 19.8, check: 20.0, arrow: 20.0 };
  const DW = 17.6, SW = 8.5;
  const cw = t => CW[t] || DW;

  if (parts.reduce((s, p) => s + p.text.length * cw(p.type), 0) <= maxW) return [parts];

  // Tokenize into {spaces, word, type} — spaces = number of leading spaces
  const toks = [];
  for (const p of parts) {
    for (const m of [...p.text.matchAll(/(\s*)(\S+)/g)]) {
      toks.push({ spaces: m[1].length, word: m[2], type: p.type });
    }
  }

  const rows = [];
  let cur = [], curW = 0, lastType = null, partStartW = 0;

  const addToCur = (text, type) => {
    const last = cur[cur.length - 1];
    if (last && last.type === type) last.text += text;
    else if (text.trim() || cur.length > 0) cur.push({ text, type });
  };

  for (const tok of toks) {
    if (tok.type !== lastType) { partStartW = curW; lastType = tok.type; }
    const sepW = tok.spaces > 0 ? SW : 0;
    const wordW = tok.word.length * cw(tok.type);

    if (cur.length > 0 && curW + sepW + wordW > maxW) {
      rows.push(cur);
      cur = [{ type: 'spacer', w: partStartW }];
      curW = partStartW;
      addToCur(tok.word, tok.type);
      curW += wordW;
    } else {
      const prefix = tok.spaces > 0 && cur.filter(p => p.type !== 'spacer').length > 0 ? ' ' : '';
      addToCur(prefix + tok.word, tok.type);
      curW += sepW + wordW;
    }
  }
  if (cur.length) rows.push(cur);

  // Widow prevention: if continuation row is short, pull last word from previous row
  if (rows.length >= 2) {
    const last = rows[rows.length - 1];
    const prev = rows[rows.length - 2];
    const contW = last.filter(p => p.type !== 'spacer').reduce((s, p) => s + p.text.length * cw(p.type), 0);
    if (contW < 200) {
      const lastPrev = [...prev].reverse().find(p => p.type !== 'spacer');
      if (lastPrev && lastPrev.text.trimEnd().includes(' ')) {
        const ws = lastPrev.text.trimEnd().split(' ');
        const moved = ws.pop();
        lastPrev.text = ws.join(' ');
        const sIdx = last.findIndex(p => p.type === 'spacer');
        const ins = sIdx >= 0 ? sIdx + 1 : 0;
        const fc = last[ins];
        if (fc && fc.type === lastPrev.type) fc.text = moved + ' ' + fc.text.trimStart();
        else last.splice(ins, 0, { text: moved + ' ', type: lastPrev.type });
      }
    }
  }

  return rows;
}


function svgContentBlock(terminalHtml, x, y, w, activateLabel) {
  const lines = parseTerminal(terminalHtml);
  const BOX_V_PAD = 40;
  const LINE_H = 56;
  const TEXT_X = x + 36;
  const MAX_TEXT_W = 798;
  const allRows = lines.flatMap(parts => wrapLine(parts, MAX_TEXT_W));
  const boxH = BOX_V_PAD * 2 + allRows.length * LINE_H;

  let out = '';

  if (activateLabel) {
    out += `<text x="${x}" y="${y - 36}" font-family="TWKEverett" font-weight="500" font-size="30"
    fill="${FG}" letter-spacing="-1" dominant-baseline="auto">${esc(activateLabel)}</text>\n`;
  }

  out += `<rect x="${x}" y="${y}" width="${w}" height="${boxH}" fill="white" stroke="${FG}" stroke-opacity="0.08" stroke-width="1"/>\n`;

  allRows.forEach((row, i) => {
    const isCont = row[0]?.type === 'spacer';
    const parts = isCont ? row.slice(1) : row;
    const rowX = x + 36 + (isCont ? row[0].w : 0);
    const lineY = y + BOX_V_PAD + i * LINE_H + LINE_H * 0.72;
    const tspans = parts.map(part => {
      let fill = FG, fw = 300, ff = 'TWKEverett', fs = 32, op = 1;
      switch (part.type) {
        case 'check':  fill = ACC; fw = 500; break;
        case 'prompt': fill = ACC; fw = 500; break;
        case 'arrow':  op = 0.3; break;
        case 'cmd':    ff = 'TWKEverettMono'; fs = 32; fw = 500; break;
      }
      return `<tspan font-family="${ff}" font-weight="${fw}" font-size="${fs}" fill="${fill}" opacity="${op}">${esc(part.text)}</tspan>`;
    }).join('');
    out += `<text x="${rowX}" y="${lineY}" font-family="TWKEverett" xml:space="preserve" dominant-baseline="auto">${tspans}</text>\n`;
  });

  return { svg: out, height: boxH };
}

// ─── Slide generators ─────────────────────────────────────────────────────────

function hookSlide(slide) {
  const fontSize = slide.headlineSize ? parseInt(slide.headlineSize) : 68;
  const lineH    = Math.round(fontSize * 1.08);
  const lines    = parseHeadline(slide.headline);

  const pillY      = 152;
  const headStartY = slide.isPill ? pillY + 56 + fontSize : 220;
  const sublineY   = headStartY + lines.length * lineH + 52;

  let body = `
<!-- Corner accents -->
<line x1="24" y1="24" x2="76" y2="24" stroke="${ACC}" stroke-width="2.5"/>
<line x1="24" y1="24" x2="24" y2="76" stroke="${ACC}" stroke-width="2.5"/>
<line x1="${W-24}" y1="24" x2="${W-76}" y2="24" stroke="${ACC}" stroke-width="2.5"/>
<line x1="${W-24}" y1="24" x2="${W-24}" y2="76" stroke="${ACC}" stroke-width="2.5"/>
<line x1="24" y1="${H-24}" x2="76" y2="${H-24}" stroke="${ACC}" stroke-width="2.5"/>
<line x1="24" y1="${H-24}" x2="24" y2="${H-76}" stroke="${ACC}" stroke-width="2.5"/>
<line x1="${W-24}" y1="${H-24}" x2="${W-76}" y2="${H-24}" stroke="${ACC}" stroke-width="2.5"/>
<line x1="${W-24}" y1="${H-24}" x2="${W-24}" y2="${H-76}" stroke="${ACC}" stroke-width="2.5"/>`;

  if (slide.isPill && slide.stepLabel) {
    const label = slide.stepLabel.toUpperCase();
    const pillW = label.length * 9.4 + 44;
    body += `
<!-- Pill -->
<rect x="${PAD}" y="${pillY}" width="${pillW}" height="36" rx="18" fill="${ACC}"/>
<text x="${PAD + pillW / 2}" y="${pillY + 24}" font-family="TWKEverettMono" font-weight="500"
      font-size="12" fill="white" text-anchor="middle" letter-spacing="2.2"
      dominant-baseline="auto">${esc(label)}</text>`;
  }

  body += '\n' + svgHeadline(lines, PAD, headStartY, fontSize);

  if (slide.subline) {
    body += '\n' + svgSubline(slide.subline, PAD, sublineY);
  }

  return wrap(body + svgIllustration(slide) + svgHookHeader());
}

function contentSlide(slide) {
  const fontSize = slide.headlineSize ? parseInt(slide.headlineSize) : 60;
  const lineH    = Math.round(fontSize * 1.08);
  const lines    = parseHeadline(slide.headline);

  const headY  = 290;
  const subY   = headY + lines.length * lineH + 44;
  const sublineExtraH = slide.subline
    ? Math.max(0, wrapSublineText(slide.subline, 30, 784).length - 1) * 38
    : 0;
  const blockY = subY + sublineExtraH + (slide.activateLabel ? 120 : 80);

  const { svg: blockSvg } = slide.terminal
    ? svgContentBlock(slide.terminal, PAD, blockY, W - PAD * 2, slide.activateLabel)
    : { svg: '' };

  const body = `
<!-- Step row — Y1 Pixel Headline pattern, 28px, 12px dot -->
${svgPixelHeadline(slide.stepLabel || '', PAD, 158, 28, 12)}
<text x="${W - PAD}" y="158" font-family="TWKEverettMono" font-weight="500" font-size="28"
      fill="${FG}" opacity="0.7" text-anchor="end" dominant-baseline="auto">${esc(slide.slideNum || '')}</text>
<line x1="${PAD}" y1="192" x2="${W - PAD}" y2="192" stroke="${FG}" stroke-opacity="0.12" stroke-width="1"/>

${svgHeadline(lines, PAD, headY, fontSize)}
${slide.subline ? svgSubline(slide.subline, PAD, subY) : ''}
${blockSvg}`;

  return wrap(svgHeader() + body + svgIllustration(slide));
}

function ctaSlide(slide) {
  const keyword = slide.ctaKeyword || '';
  const kFontSz = 52;
  const kBoxW   = Math.max(keyword.length * 31 + 80, 300);
  const kBoxX   = (W - kBoxW) / 2;
  const midY    = Math.round(H / 2);

  const eyebrowY    = midY - 168;
  const kBoxY       = midY - 116;
  const kTextY      = midY - 48;
  const followY     = midY + 46;
  const claimY      = followY + 52;
  const peaceIconSz = 48;
  const peaceIconCY = 1080;
  const peaceIconX  = Math.round((W - peaceIconSz) / 2);
  const signoffY    = peaceIconCY + peaceIconSz / 2 + 44;

  const body = `
<!-- Eyebrow — 28px pixel headline -->
${svgPixelHeadlineCentered('DAS WICHTIGSTE', eyebrowY, 28, 12)}

<!-- Keyword box -->
<rect x="${kBoxX}" y="${kBoxY}" width="${kBoxW}" height="96" fill="none" stroke="${ACC}" stroke-width="2"/>
<text x="${W / 2}" y="${kTextY}" font-family="TWKEverettMono" font-weight="500" font-size="${kFontSz}"
      fill="${FG}" text-anchor="middle" dominant-baseline="auto">${esc(keyword.toUpperCase())}</text>

<!-- Follow line -->
<text x="${W / 2}" y="${followY}" font-family="TWKEverettMono" font-weight="500" font-size="20"
      fill="${FG}" text-anchor="middle" letter-spacing="2.5" dominant-baseline="auto">FOLGE <tspan fill="${ACC}">${esc(HANDLE.toUpperCase())}</tspan></text>

<!-- Brand claim -->
<text x="${W / 2}" y="${claimY}" font-family="TWKEverettMono" font-weight="500" font-size="14"
      fill="${FG}" opacity="0.5" text-anchor="middle" letter-spacing="2" dominant-baseline="auto">DIGITAL LOVE | SCALE E-COMMERCE</text>

<!-- Peace-hand icon -->
<image href="data:image/svg+xml;base64,${PEACE_HAND_B64}" x="${peaceIconX}" y="${peaceIconCY - peaceIconSz / 2}" width="${peaceIconSz}" height="${peaceIconSz}"/>

<!-- Bundesgarten Ciao -->
<text x="${W / 2}" y="${signoffY}" font-family="TWKEverettMono" font-weight="500" font-size="17"
      fill="${FG}" text-anchor="middle" letter-spacing="2" dominant-baseline="auto">BUNDESGARTEN CIAO</text>

`;

  return wrap(svgHeader() + body);
}

function wrap(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}" height="${H}">
<defs><style>${FONT_DEFS}</style></defs>
<rect width="${W}" height="${H}" fill="${BG}"/>
${body}
</svg>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function buildSlide(slide) {
  if (slide.isCTA)  return ctaSlide(slide);
  if (slide.isHook) return hookSlide(slide);
  return contentSlide(slide);
}

async function renderSlides(slides, outputDir, srcJsonPath) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  for (const slide of slides) {
    const svgContent = buildSlide(slide);
    const outPath = path.join(outputDir, slide.name + '.png');
    await sharp(Buffer.from(svgContent)).png().toFile(outPath);
    console.log('✓ ' + slide.name + '.png');
  }
  console.log('\nOutput → ' + outputDir);

  if (srcJsonPath) {
    const abs = path.resolve(srcJsonPath);
    if (fs.existsSync(abs)) {
      const dest = path.join(outputDir, path.basename(abs));
      fs.renameSync(abs, dest);
      console.log('→ archived: ' + path.basename(abs));
    }
  }
}

if (require.main === module) {
  const slidesPath = path.join(BASE, 'slides.json');
  if (!fs.existsSync(slidesPath)) {
    console.error('No slides.json found.');
    process.exit(1);
  }
  const slides = JSON.parse(fs.readFileSync(slidesPath, 'utf8'));
  const outputDir = path.join(BASE, 'output');
  renderSlides(slides, outputDir).catch(console.error);
}

// Replace straight ASCII closing quote after German opening „ with proper U+201D
function fixGermanQuotes(raw) {
  try { JSON.parse(raw); return raw; } catch(e) {}
  return raw.replace(/„([^"\n]*?)"/g, '„$1”');
}

function loadSlides(filepath) {
  const raw = fs.readFileSync(path.resolve(filepath), 'utf8');
  return JSON.parse(fixGermanQuotes(raw));
}

module.exports = { renderSlides, buildSlide, loadSlides };
