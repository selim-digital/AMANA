/** Univers AMANA — illustrations V4.
 *  Principes : perspective atmosphérique (les plans lointains se fondent dans
 *  le ciel), lumières de crête, brume entre les plans, grain léger, et le
 *  chemin en pointillés or montant vers une destination éclairée. */

/* silhouette de sapin, pointes irrégulières */
export function fir(x: number, b: number, h: number): string {
  const w = h * 0.4;
  return (
    `M ${x - w} ${b} L ${x - w * 0.28} ${b - h * 0.4} L ${x - w * 0.52} ${b - h * 0.42} ` +
    `L ${x - w * 0.16} ${b - h * 0.72} L ${x - w * 0.32} ${b - h * 0.74} L ${x} ${b - h} ` +
    `L ${x + w * 0.32} ${b - h * 0.74} L ${x + w * 0.16} ${b - h * 0.72} ` +
    `L ${x + w * 0.52} ${b - h * 0.42} L ${x + w * 0.28} ${b - h * 0.4} L ${x + w} ${b} Z`
  );
}

function Grain({ id }: { id: string }) {
  return (
    <>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.045 0" />
      </filter>
      <rect width="1600" height="700" filter={`url(#${id})`} />
    </>
  );
}

function Destination({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <g className="anim-glowpulse">
        <circle cx={x} cy={y} r="64" fill="#E9BE6B" opacity=".14" />
        <circle cx={x} cy={y} r="40" fill="#E9BE6B" opacity=".18" />
      </g>
      <circle cx={x} cy={y} r="30" fill="none" stroke="#E4AE55" strokeWidth="2.5" opacity=".7" />
      <circle cx={x} cy={y} r="20" fill="#DCA94F" stroke="#161310" strokeWidth="4" />
      <circle cx={x} cy={y} r="7" fill="#161310" />
    </g>
  );
}

function Node({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r="11" fill="#F7EFDC" stroke="#161310" strokeWidth="4" />;
}

/* ============================== DÉSERT ============================== */

export function DesertScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Desert Path">
      <defs>
        <linearGradient id="d4-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBF1DE" /><stop offset=".45" stopColor="#F7E4C2" />
          <stop offset=".75" stopColor="#F0D2A2" /><stop offset="1" stopColor="#EABF84" />
        </linearGradient>
        <radialGradient id="d4-halo" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#F0C377" stopOpacity=".9" />
          <stop offset=".55" stopColor="#EEBE6C" stopOpacity=".28" />
          <stop offset="1" stopColor="#EEBE6C" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="d4-dune1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9B584" /><stop offset="1" stopColor="#CDA36A" />
        </linearGradient>
        <linearGradient id="d4-dune2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#C2924F" /><stop offset="1" stopColor="#B07E3F" />
        </linearGradient>
        <linearGradient id="d4-dune3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A26F33" /><stop offset="1" stopColor="#8A5A28" />
        </linearGradient>
      </defs>

      <rect width="1600" height="700" fill="url(#d4-sky)" />
      <circle cx="1180" cy="235" r="300" fill="url(#d4-halo)" className="anim-halo" />
      <circle cx="1180" cy="235" r="66" fill="#E9B25E" />
      <circle cx="1180" cy="235" r="66" fill="none" stroke="#F7E0AE" strokeWidth="3" opacity=".6" />

      {/* massifs lointains, fondus dans le ciel */}
      <path d="M0 372 C 140 330, 250 352, 380 318 C 500 288, 610 336, 760 322 C 900 310, 1010 348, 1160 340 C 1320 331, 1450 355, 1600 336 V700 H0 Z" fill="#E5CB9E" opacity=".85" />
      <path d="M0 412 C 170 380, 330 402, 520 372 C 700 344, 860 392, 1060 378 C 1260 364, 1430 398, 1600 380 V700 H0 Z" fill="#D9BB85" opacity=".9" />

      {/* dunes en trois plans, avec lumière de crête */}
      <path d="M0 470 C 280 408, 520 486, 820 448 C 1120 412, 1350 474, 1600 436 V700 H0 Z" fill="url(#d4-dune1)" />
      <path d="M0 470 C 280 408, 520 486, 820 448 C 1120 412, 1350 474, 1600 436" fill="none" stroke="#F2DFB4" strokeWidth="3.5" opacity=".55" />
      <path d="M0 560 C 300 496, 600 606, 940 552 C 1240 506, 1440 580, 1600 540 V700 H0 Z" fill="url(#d4-dune2)" />
      <path d="M0 560 C 300 496, 600 606, 940 552 C 1240 506, 1440 580, 1600 540" fill="none" stroke="#E9CD93" strokeWidth="3" opacity=".5" />
      <path d="M0 640 C 340 586, 640 682, 1000 630 C 1280 590, 1460 650, 1600 616 V700 H0 Z" fill="url(#d4-dune3)" />
      <path d="M0 640 C 340 586, 640 682, 1000 630 C 1280 590, 1460 650, 1600 616" fill="none" stroke="#D9B476" strokeWidth="2.5" opacity=".45" />

      {/* vie discrète : herbes, pierres, oiseaux */}
      <g stroke="#6E5024" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".7">
        <path d="M310 655 C 306 640 306 632 311 620 M318 656 C 318 642 320 634 327 626 M302 657 C 296 646 294 638 295 630" />
        <path d="M1235 612 C 1231 598 1231 590 1236 579 M1243 613 C 1243 600 1245 592 1251 585" />
      </g>
      <ellipse cx="360" cy="659" rx="16" ry="5" fill="#6E5024" opacity=".4" />
      <ellipse cx="1195" cy="616" rx="12" ry="4" fill="#6E5024" opacity=".35" />
      <g stroke="#7A5A2E" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".6" className="anim-birds">
        <path d="M690 168 Q 706 154 722 168 M 740 182 Q 754 170 768 182" />
        <path d="M810 148 Q 822 138 834 148" />
      </g>

      {/* le chemin */}
      <path d="M140 655 C 360 615, 500 565, 660 522 C 850 472, 1000 442, 1130 384 C 1240 335, 1310 290, 1368 242"
        fill="none" stroke="#F6E8C6" strokeWidth="5" strokeDasharray="1.5 20" strokeLinecap="round" className="anim-path" />
      <circle cx="140" cy="655" r="14" fill="#161310" /><circle cx="140" cy="655" r="5.5" fill="#E4AE55" />
      <Node x={660} y={522} />
      <Node x={1130} y={384} />
      <Destination x={1368} y={242} />

      <Grain id="grain-d4" />
    </svg>
  );
}

/* ============================== FORÊT ============================== */

const FIRS_FAR = [80, 180, 290, 420, 560, 1020, 1140, 1280, 1400, 1520].map((x, i) =>
  fir(x, 430, 120 + ((i * 37) % 60))
);
const FIRS_MID = [40, 150, 330, 470, 1150, 1300, 1460, 1580].map((x, i) =>
  fir(x, 500, 190 + ((i * 53) % 80))
);
const FIRS_NEAR = [110, 260, 1360, 1520].map((x, i) => fir(x, 580, 280 + ((i * 71) % 70)));

export function ForestScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Forest Path">
      <defs>
        <linearGradient id="f4-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F5E6" /><stop offset=".6" stopColor="#E9EEDA" />
          <stop offset="1" stopColor="#DCE5CB" />
        </linearGradient>
        <radialGradient id="f4-light" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#F5E5AC" stopOpacity=".95" />
          <stop offset=".6" stopColor="#F2DFA4" stopOpacity=".3" />
          <stop offset="1" stopColor="#F2DFA4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="f4-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#587349" /><stop offset="1" stopColor="#41593A" />
        </linearGradient>
        <filter id="f4-blur"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>

      <rect width="1600" height="700" fill="url(#f4-sky)" />
      <circle cx="1150" cy="250" r="320" fill="url(#f4-light)" className="anim-halo" />
      <circle cx="1150" cy="250" r="44" fill="#EDC671" opacity=".9" />

      {/* plans de forêt, du voilé au profond */}
      <g fill="#C6D0B2" opacity=".85">{FIRS_FAR.map((d, i) => <path key={i} d={d} />)}</g>
      <rect x="-40" y="380" width="1700" height="70" fill="#EFF2E0" opacity=".5" filter="url(#f4-blur)" className="anim-mist" />
      <g fill="#93A67E">{FIRS_MID.map((d, i) => <path key={i} d={d} />)}</g>
      <rect x="-40" y="470" width="1700" height="60" fill="#E9EDD8" opacity=".4" filter="url(#f4-blur)" className="anim-mist" style={{ animationDelay: "-8s" }} />
      <g fill="#4E6A45">{FIRS_NEAR.map((d, i) => <path key={i} d={d} />)}</g>
      <g fill="#33502F">
        <path d={fir(30, 640, 330)} /><path d={fir(1560, 660, 360)} />
      </g>

      {/* sol et rivière */}
      <path d="M0 560 C 300 508, 620 588, 940 548 C 1220 514, 1420 562, 1600 530 V700 H0 Z" fill="url(#f4-ground)" />
      <path d="M-40 636 C 240 592, 430 660, 700 622 C 960 586, 1190 648, 1640 602" stroke="#8FB4A9" strokeWidth="26" fill="none" strokeLinecap="round" opacity=".85" />
      <path d="M-40 630 C 240 588, 430 654, 700 617 C 960 582, 1190 642, 1640 597" stroke="#DDEBE2" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".6" className="anim-shimmer" />
      <path d="M0 676 C 300 646, 640 690, 980 662 C 1260 640, 1450 672, 1600 652 V700 H0 Z" fill="#3A5236" />

      {/* le chemin */}
      <path d="M150 668 C 340 630, 520 588, 700 542 C 900 492, 1030 452, 1130 396 C 1230 342, 1290 292, 1330 232"
        fill="none" stroke="#EFDCA6" strokeWidth="5" strokeDasharray="1.5 20" strokeLinecap="round" className="anim-path" />
      <circle cx="150" cy="668" r="14" fill="#161310" /><circle cx="150" cy="668" r="5.5" fill="#DCA94F" />
      <Node x={700} y={542} />
      <Node x={1130} y={396} />
      <Destination x={1330} y={232} />

      <Grain id="grain-f4" />
    </svg>
  );
}

/* ============================== OCÉAN ============================== */

export function OceanScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Ocean Path">
      <defs>
        <linearGradient id="o4-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E2EEF1" /><stop offset=".55" stopColor="#ECEBD8" />
          <stop offset=".82" stopColor="#F4DFB2" /><stop offset="1" stopColor="#F1CE90" />
        </linearGradient>
        <linearGradient id="o4-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9C6C9" /><stop offset=".35" stopColor="#7FA6AE" />
          <stop offset="1" stopColor="#4E7A86" />
        </linearGradient>
        <linearGradient id="o4-cliff" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#96805D" /><stop offset="1" stopColor="#6E5A3E" />
        </linearGradient>
        <radialGradient id="o4-beam" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#F2D28A" stopOpacity=".95" />
          <stop offset=".6" stopColor="#F0CE82" stopOpacity=".3" />
          <stop offset="1" stopColor="#F0CE82" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="o4-ray" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F2D28A" stopOpacity=".5" /><stop offset="1" stopColor="#F2D28A" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1600" height="700" fill="url(#o4-sky)" />
      <circle cx="980" cy="215" r="54" fill="#ECB663" />
      <circle cx="980" cy="215" r="54" fill="none" stroke="#F7E2B2" strokeWidth="3" opacity=".65" />

      {/* mer, île lointaine, reflet du soleil */}
      <rect y="388" width="1600" height="312" fill="url(#o4-sea)" />
      <path d="M60 388 C 130 362, 270 358, 360 388 Z" fill="#9DB3AC" opacity=".65" />
      <g stroke="#F2D9A0" strokeLinecap="round" opacity=".8" className="anim-shimmer">
        <path d="M950 412 H1010" strokeWidth="5" />
        <path d="M958 436 H1002" strokeWidth="4" />
        <path d="M948 462 H1012" strokeWidth="4" />
      </g>
      <g stroke="#E2EFEA" fill="none" strokeLinecap="round" opacity=".75" className="anim-waves">
        <path d="M80 452 Q 150 440 220 452 T 380 452" strokeWidth="4" />
        <path d="M440 500 Q 520 486 600 500 T 760 500" strokeWidth="4" />
        <path d="M120 545 Q 200 531 280 545 T 420 545" strokeWidth="3.5" />
      </g>

      {/* voilier, sur l'eau */}
      <g className="anim-boat">
        <path d="M330 476 C 350 486, 410 486, 428 476 L 416 462 H 342 Z" fill="#2E2A24" />
        <path d="M374 456 V356 L 326 450 Z" fill="#F6F1E4" />
        <path d="M384 456 V372 L 426 450 Z" fill="#EAE2CC" />
        <path d="M374 356 V456" stroke="#2E2A24" strokeWidth="3" />
      </g>
      <g stroke="#2E2A24" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".7" className="anim-birds">
        <path d="M420 190 Q 434 178 448 190 M 466 200 Q 478 190 490 200" />
      </g>

      {/* falaise basse en deux plans, la mer reste ouverte */}
      <path d="M700 700 V470 C 950 420, 1200 350, 1380 300 C 1460 278, 1540 252, 1600 235 V700 Z" fill="#AE9A76" opacity=".55" />
      <path d="M0 700 V608 C 240 588, 480 560, 720 518 C 960 476, 1160 424, 1330 360 C 1430 322, 1520 285, 1600 250 V700 Z" fill="url(#o4-cliff)" />
      <path d="M0 608 C 240 588, 480 560, 720 518 C 960 476, 1160 424, 1330 360 C 1430 322, 1520 285, 1600 250" fill="none" stroke="#C8B183" strokeWidth="3" opacity=".55" />
      <path d="M0 700 V662 C 300 642, 640 648, 980 618 C 1260 592, 1450 562, 1600 538 V700 Z" fill="#5F4E36" />

      {/* le phare : fût galbé, galerie, dôme, faisceau */}
      <g transform="translate(14 150)">
        <circle cx="1372" cy="86" r="130" fill="url(#o4-beam)" className="anim-beam" />
        <path d="M1372 60 L 1100 14 L 1100 100 Z" fill="url(#o4-ray)" className="anim-beam" style={{ animationDelay: "-2s" }} />
        <path d="M1344 178 C 1348 128, 1352 92, 1358 62 L 1386 62 C 1392 92, 1396 128, 1400 178 Z" fill="#F6F1E4" stroke="#161310" strokeWidth="4.5" />
        <path d="M1350 142 L 1394 142 L 1392 120 L 1352 120 Z" fill="#B8543F" />
        <path d="M1354 100 L 1390 100 L 1389 88 L 1355 88 Z" fill="#B8543F" />
        <path d="M1348 62 H 1396" stroke="#161310" strokeWidth="5" strokeLinecap="round" />
        <rect x="1356" y="38" width="32" height="22" rx="4" fill="#161310" />
        <circle cx="1372" cy="49" r="7.5" fill="#F2C56B" />
        <path d="M1362 38 C 1364 28, 1380 28, 1382 38 Z" fill="#161310" />
        <path d="M1330 180 H 1414" stroke="#161310" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* le chemin, le long de la côte vers la lumière */}
      <path d="M140 660 C 340 630, 560 600, 760 550 C 980 496, 1160 440, 1300 385 C 1350 366, 1372 352, 1390 338"
        fill="none" stroke="#F2DCA4" strokeWidth="5" strokeDasharray="1.5 20" strokeLinecap="round" className="anim-path" />
      <circle cx="140" cy="660" r="14" fill="#161310" /><circle cx="140" cy="660" r="5.5" fill="#E4AE55" />
      <Node x={760} y={550} />
      <Node x={1300} y={385} />

      <Grain id="grain-o4" />
    </svg>
  );
}

/* ============================ BANDEAU ============================ */

/** Points échantillonnés le long de la courbe du chemin du bandeau (390×190). */
const BANNER_PATH_POINTS: [number, number][] = [
  [40, 172], [70, 164], [100, 156], [130, 147], [160, 138], [190, 128],
  [220, 118], [250, 110], [280, 100], [310, 88], [340, 72], [372, 52],
];

/** Bandeau paysage de l'onboarding : le désert, avec la position qui avance
 *  sur le chemin selon la progression (0 → 1). */
export function PathBanner({ progress = 0 }: { progress?: number }) {
  const idx = Math.min(
    BANNER_PATH_POINTS.length - 1,
    Math.round(progress * (BANNER_PATH_POINTS.length - 1))
  );
  const [cx, cy] = BANNER_PATH_POINTS[idx];
  return (
    <svg viewBox="0 0 390 190" className="block w-full" aria-hidden="true">
      <defs>
        <linearGradient id="ob4-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBF1DE" /><stop offset=".6" stopColor="#F5DFB8" />
          <stop offset="1" stopColor="#EFD0A0" />
        </linearGradient>
        <radialGradient id="ob4-halo" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#F0C377" stopOpacity=".85" /><stop offset="1" stopColor="#F0C377" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="390" height="190" fill="url(#ob4-sky)" />
      <circle cx="302" cy="64" r="88" fill="url(#ob4-halo)" className="anim-halo" />
      <circle cx="302" cy="64" r="30" fill="#E9B25E" />
      <path d="M0 132 C 50 112, 90 122, 140 104 C 190 88, 240 108, 300 96 C 340 89, 370 98, 390 92 V190 H0 Z" fill="#E2C895" opacity=".85" />
      <path d="M0 152 C 70 134, 130 148, 200 130 C 270 114, 330 134, 390 120 V190 H0 Z" fill="#D3AC6F" />
      <path d="M0 174 C 90 158, 200 178, 300 160 C 340 153, 370 160, 390 154 V190 H0 Z" fill="#B98A4A" />
      <path d="M0 174 C 90 158, 200 178, 300 160 C 340 153, 370 160, 390 154" fill="none" stroke="#EBD3A0" strokeWidth="2" opacity=".55" />
      <path d="M40 172 C 120 158, 200 134, 270 108 C 320 90, 350 72, 372 52"
        fill="none" stroke="#F8EED2" strokeWidth="3.5" strokeDasharray="1.2 13" strokeLinecap="round" className="anim-path-sm" />
      <circle cx="372" cy="52" r="14" fill="#E9BE6B" opacity=".35" className="anim-glowpulse" />
      <circle cx="372" cy="52" r="8.5" fill="#DCA94F" stroke="#161310" strokeWidth="3" />
      <circle cx={cx} cy={cy} r="7" fill="#161310" />
      <circle cx={cx} cy={cy} r="2.8" fill="#E4AE55" />
      <text x="24" y="42" fontSize="15" fontWeight="800" letterSpacing="6" fill="#161310" fontFamily="system-ui,sans-serif">
        AMANA
      </text>
    </svg>
  );
}

/** Chemin consolidé du dashboard : étapes franchies (encre), position actuelle
 *  (ivoire cerclé), destination (or). */
export function Chemin({ done = 2, total = 5 }: { done?: number; total?: number }) {
  const pts: [number, number][] = Array.from({ length: total }, (_, i) => {
    const t = i / (total - 1);
    return [24 + t * 330, 58 - t * 40 - Math.sin(t * Math.PI) * 6];
  });
  const d = `M ${pts[0][0]} ${pts[0][1]} ` + pts.slice(1).map(([x, y]) => `L ${x} ${y}`).join(" ");
  return (
    <svg viewBox="0 0 390 76" className="block w-full" aria-label={`Progression : étape ${done} sur ${total}`}>
      <path d={d} fill="none" className="stroke-gold" strokeWidth="3" strokeDasharray="1.5 11" strokeLinecap="round" />
      {pts.map(([x, y], i) => {
        const last = i === total - 1;
        if (last)
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="13" fill="none" className="stroke-gold" strokeWidth="2" opacity=".5" />
              <circle cx={x} cy={y} r="8" className="fill-gold" />
            </g>
          );
        if (i < done) return <circle key={i} cx={x} cy={y} r="6" className="fill-ink" />;
        if (i === done)
          return <circle key={i} cx={x} cy={y} r="7" className="fill-surface stroke-ink" strokeWidth="3" />;
        return <circle key={i} cx={x} cy={y} r="5" className="fill-ink/20" />;
      })}
    </svg>
  );
}
