#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const figureDir = path.join(root, 'manuscript', 'figures');
const dataDir = path.join(root, 'manuscript', 'data');

fs.mkdirSync(figureDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

const colors = {
  ink: '#1f2328',
  muted: '#667085',
  cu: '#b45309',
  cuLight: '#fbbf24',
  ag: '#9ca3af',
  ru: '#7c3aed',
  co2: '#0f766e',
  c2: '#2563eb',
  c3: '#c2410c',
  bg: '#fffaf0',
  grid: '#e5e7eb'
};

function write(name, content) {
  fs.writeFileSync(path.join(figureDir, name), content, 'utf8');
}

function line(points, color, width = 3) {
  return `<polyline fill="none" stroke="${color}" stroke-width="${width}" points="${points.map((p) => p.join(',')).join(' ')}"/>`;
}

function axis(width, height, left, top, plotW, plotH, xLabel, yLabel) {
  const yTicks = [0, 25, 50, 75, 100];
  const grid = yTicks.map((tick) => {
    const y = top + plotH - (tick / 100) * plotH;
    return `<line x1="${left}" y1="${y}" x2="${left + plotW}" y2="${y}" stroke="${colors.grid}"/>
<text x="${left - 10}" y="${y + 4}" text-anchor="end" font-size="12" fill="${colors.muted}">${tick}</text>`;
  }).join('\n');
  return `<rect width="${width}" height="${height}" fill="white"/>
${grid}
<line x1="${left}" y1="${top}" x2="${left}" y2="${top + plotH}" stroke="${colors.ink}" stroke-width="2"/>
<line x1="${left}" y1="${top + plotH}" x2="${left + plotW}" y2="${top + plotH}" stroke="${colors.ink}" stroke-width="2"/>
<text x="${left + plotW / 2}" y="${height - 16}" text-anchor="middle" font-size="14" fill="${colors.ink}">${xLabel}</text>
<text x="18" y="${top + plotH / 2}" text-anchor="middle" font-size="14" fill="${colors.ink}" transform="rotate(-90 18 ${top + plotH / 2})">${yLabel}</text>`;
}

function pointSeries(xs, ys, left, top, plotW, plotH, xMin, xMax, yMax = 100) {
  return xs.map((x, index) => {
    const px = left + ((x - xMin) / (xMax - xMin)) * plotW;
    const py = top + plotH - (ys[index] / yMax) * plotH;
    return [Number(px.toFixed(1)), Number(py.toFixed(1))];
  });
}

const performanceData = {
  note: 'Synthetic planning data for manuscript mock figures. Replace with measured GC/NMR data before submission.',
  potentials_V_vs_RHE: [-0.55, -0.65, -0.75, -0.85, -0.95, -1.05],
  h_cell_faradaic_efficiency_percent: {
    Cu_NW_C1: [22, 18, 15, 14, 12, 11],
    Cu_NW_C2: [10, 18, 26, 31, 29, 24],
    Cu_Ag_Ru_C3: [1, 4, 9, 15, 18, 16]
  },
  flow_cell: {
    time_h: [0, 2, 4, 6, 8, 10, 12],
    total_current_density_mA_cm2: [210, 235, 250, 248, 242, 236, 230],
    C2plus_FE_percent: [41, 48, 54, 55, 53, 52, 50],
    C3_FE_percent: [8, 12, 16, 18, 17, 16, 15]
  },
  catalyst_screen: {
    labels: ['Cu NW', 'Cu-Ag NW', 'Cu-Ru NW', 'Cu-Ag-Ru NW'],
    CO_FE_percent: [14, 27, 12, 19],
    C2_FE_percent: [31, 35, 29, 39],
    C3_FE_percent: [5, 9, 11, 18]
  }
};

fs.writeFileSync(
  path.join(dataDir, 'simulated_performance.json'),
  `${JSON.stringify(performanceData, null, 2)}\n`,
  'utf8'
);

write('fig1_catalyst_concept.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="680" viewBox="0 0 1100 680" role="img" aria-labelledby="title desc">
<title id="title">Cu nanowire catalyst concept with Ag and Ru modifiers</title>
<desc id="desc">Schematic showing Cu nanowire growth, Ag CO generating sites, Ru hydrogenation sites, and C3 coupling on reconstructed copper.</desc>
<rect width="1100" height="680" fill="${colors.bg}"/>
<text x="40" y="58" font-size="28" font-weight="700" fill="${colors.ink}">Cu/Ag/Ru nanowire catalyst concept</text>
<text x="40" y="88" font-size="15" fill="${colors.muted}">Mechanistic hypothesis for tandem CO supply, Cu C-C coupling, and Ru-assisted hydrogenation</text>
<rect x="70" y="505" width="960" height="70" rx="10" fill="#78350f"/>
<text x="550" y="548" text-anchor="middle" font-size="18" fill="white">Cu foam / GDE current collector</text>
${Array.from({ length: 16 }).map((_, i) => {
  const x = 110 + i * 58;
  const h = 220 + (i % 4) * 26;
  return `<path d="M${x} 510 C${x - 18} ${430 - h * 0.1}, ${x + 24} ${370 - h * 0.1}, ${x + (i % 2 ? 12 : -10)} ${510 - h}" stroke="${colors.cu}" stroke-width="18" fill="none" stroke-linecap="round"/>
<path d="M${x} 510 C${x - 18} ${430 - h * 0.1}, ${x + 24} ${370 - h * 0.1}, ${x + (i % 2 ? 12 : -10)} ${510 - h}" stroke="${colors.cuLight}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
}).join('\n')}
${Array.from({ length: 14 }).map((_, i) => {
  const x = 138 + i * 65;
  const y = 285 + (i % 5) * 28;
  return `<circle cx="${x}" cy="${y}" r="${14 + (i % 3)}" fill="${colors.ag}" stroke="#f8fafc" stroke-width="3"/>
<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="12" fill="${colors.ink}">Ag</text>`;
}).join('\n')}
${Array.from({ length: 10 }).map((_, i) => {
  const x = 185 + i * 82;
  const y = 220 + (i % 4) * 42;
  return `<circle cx="${x}" cy="${y}" r="13" fill="${colors.ru}" opacity="0.92"/>
<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="11" fill="white">Ru</text>`;
}).join('\n')}
<path d="M130 150 C260 90, 345 135, 455 95" stroke="${colors.co2}" stroke-width="3" fill="none" marker-end="url(#arrow)"/>
<text x="100" y="138" font-size="18" fill="${colors.co2}">CO2 to CO at Ag-rich sites</text>
<path d="M460 118 C560 170, 620 165, 705 210" stroke="${colors.c2}" stroke-width="3" fill="none" marker-end="url(#arrow)"/>
<text x="500" y="112" font-size="18" fill="${colors.c2}">CO spillover to Cu(100)/(111)</text>
<path d="M720 232 C795 280, 850 330, 930 370" stroke="${colors.c3}" stroke-width="3" fill="none" marker-end="url(#arrow)"/>
<text x="730" y="218" font-size="18" fill="${colors.c3}">C2 + C1 coupling to C3 oxygenates</text>
<rect x="748" y="424" width="240" height="54" rx="10" fill="white" stroke="${colors.c3}" stroke-width="2"/>
<text x="868" y="457" text-anchor="middle" font-size="18" font-weight="700" fill="${colors.c3}">n-propanol / propionaldehyde</text>
<rect x="70" y="610" width="960" height="34" rx="8" fill="#fff7ed" stroke="#fdba74"/>
<text x="550" y="632" text-anchor="middle" font-size="14" fill="#9a3412">Simulated figure: conceptual mechanism only. Replace with experimental evidence before submission.</text>
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
  </marker>
</defs>
</svg>`);

const xs = performanceData.potentials_V_vs_RHE;
const left = 82;
const top = 80;
const plotW = 710;
const plotH = 390;
const xMin = -1.05;
const xMax = -0.55;
const c1 = pointSeries(xs, performanceData.h_cell_faradaic_efficiency_percent.Cu_NW_C1, left, top, plotW, plotH, xMin, xMax);
const c2 = pointSeries(xs, performanceData.h_cell_faradaic_efficiency_percent.Cu_NW_C2, left, top, plotW, plotH, xMin, xMax);
const c3 = pointSeries(xs, performanceData.h_cell_faradaic_efficiency_percent.Cu_Ag_Ru_C3, left, top, plotW, plotH, xMin, xMax);

write('fig2_hcell_screening.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="600" viewBox="0 0 980 600" role="img" aria-labelledby="title desc">
<title id="title">Simulated H-cell faradaic efficiency screening</title>
<desc id="desc">Line plot of simulated faradaic efficiency for C1, C2, and C3 product classes across potentials.</desc>
${axis(980, 600, left, top, plotW, plotH, 'Potential / V vs RHE', 'Faradaic efficiency / %')}
<text x="62" y="42" font-size="24" font-weight="700" fill="${colors.ink}">H-cell catalyst screening concept</text>
${xs.map((x) => {
  const px = left + ((x - xMin) / (xMax - xMin)) * plotW;
  return `<text x="${px}" y="${top + plotH + 24}" text-anchor="middle" font-size="12" fill="${colors.muted}">${x}</text>`;
}).join('\n')}
${line(c1, colors.co2)}
${line(c2, colors.c2)}
${line(c3, colors.c3)}
${c1.concat(c2, c3).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="${i < c1.length ? colors.co2 : i < c1.length + c2.length ? colors.c2 : colors.c3}"/>`).join('\n')}
<rect x="825" y="104" width="120" height="94" rx="8" fill="white" stroke="${colors.grid}"/>
<circle cx="842" cy="130" r="5" fill="${colors.co2}"/><text x="858" y="135" font-size="13" fill="${colors.ink}">C1 products</text>
<circle cx="842" cy="158" r="5" fill="${colors.c2}"/><text x="858" y="163" font-size="13" fill="${colors.ink}">C2 products</text>
<circle cx="842" cy="186" r="5" fill="${colors.c3}"/><text x="858" y="191" font-size="13" fill="${colors.ink}">C3 products</text>
<text x="490" y="555" text-anchor="middle" font-size="13" fill="${colors.muted}">Synthetic planning data. Intended shape: C2+ selectivity rises with CO coverage while HER must remain controlled.</text>
</svg>`);

const flow = performanceData.flow_cell;
const time = flow.time_h;
const left3 = 82;
const top3 = 80;
const plotW3 = 710;
const plotH3 = 390;
const jd = pointSeries(time, flow.total_current_density_mA_cm2.map((v) => (v / 300) * 100), left3, top3, plotW3, plotH3, 0, 12);
const c2plus = pointSeries(time, flow.C2plus_FE_percent, left3, top3, plotW3, plotH3, 0, 12);
const c3flow = pointSeries(time, flow.C3_FE_percent, left3, top3, plotW3, plotH3, 0, 12);

write('fig3_flowcell_stability.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="600" viewBox="0 0 980 600" role="img" aria-labelledby="title desc">
<title id="title">Simulated flow-cell stability</title>
<desc id="desc">Line plot of synthetic current density, C2+ faradaic efficiency, and C3 faradaic efficiency over 12 hours.</desc>
${axis(980, 600, left3, top3, plotW3, plotH3, 'Time / h', 'Normalized value or FE / %')}
<text x="62" y="42" font-size="24" font-weight="700" fill="${colors.ink}">Flow-cell stability target</text>
${time.map((x) => {
  const px = left3 + (x / 12) * plotW3;
  return `<text x="${px}" y="${top3 + plotH3 + 24}" text-anchor="middle" font-size="12" fill="${colors.muted}">${x}</text>`;
}).join('\n')}
${line(jd, colors.ink)}
${line(c2plus, colors.c2)}
${line(c3flow, colors.c3)}
${jd.concat(c2plus, c3flow).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="${i < jd.length ? colors.ink : i < jd.length + c2plus.length ? colors.c2 : colors.c3}"/>`).join('\n')}
<rect x="808" y="104" width="142" height="96" rx="8" fill="white" stroke="${colors.grid}"/>
<circle cx="826" cy="130" r="5" fill="${colors.ink}"/><text x="842" y="135" font-size="13" fill="${colors.ink}">j / 300</text>
<circle cx="826" cy="158" r="5" fill="${colors.c2}"/><text x="842" y="163" font-size="13" fill="${colors.ink}">C2+ FE</text>
<circle cx="826" cy="186" r="5" fill="${colors.c3}"/><text x="842" y="191" font-size="13" fill="${colors.ink}">C3 FE</text>
<text x="490" y="555" text-anchor="middle" font-size="13" fill="${colors.muted}">Synthetic planning data for target behavior in alkaline flow-cell operation.</text>
</svg>`);

const bars = performanceData.catalyst_screen;
const barW = 34;
const gap = 16;
const groupGap = 46;
const chartBase = 455;
const chartTop = 92;
const scale = (chartBase - chartTop) / 60;

write('fig4_modifier_comparison.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="980" height="600" viewBox="0 0 980 600" role="img" aria-labelledby="title desc">
<title id="title">Simulated modifier comparison</title>
<desc id="desc">Grouped bar chart showing synthetic CO, C2, and C3 faradaic efficiencies for Cu, Cu-Ag, Cu-Ru, and Cu-Ag-Ru nanowires.</desc>
<rect width="980" height="600" fill="white"/>
<text x="62" y="42" font-size="24" font-weight="700" fill="${colors.ink}">Modifier comparison: working hypothesis</text>
${[0, 15, 30, 45, 60].map((tick) => {
  const y = chartBase - tick * scale;
  return `<line x1="82" y1="${y}" x2="900" y2="${y}" stroke="${colors.grid}"/><text x="70" y="${y + 4}" text-anchor="end" font-size="12" fill="${colors.muted}">${tick}</text>`;
}).join('\n')}
<line x1="82" y1="${chartTop}" x2="82" y2="${chartBase}" stroke="${colors.ink}" stroke-width="2"/>
<line x1="82" y1="${chartBase}" x2="900" y2="${chartBase}" stroke="${colors.ink}" stroke-width="2"/>
${bars.labels.map((label, group) => {
  const x0 = 120 + group * (barW * 3 + gap * 2 + groupGap);
  const values = [bars.CO_FE_percent[group], bars.C2_FE_percent[group], bars.C3_FE_percent[group]];
  const fills = [colors.co2, colors.c2, colors.c3];
  return values.map((value, i) => {
    const h = value * scale;
    const x = x0 + i * (barW + gap);
    return `<rect x="${x}" y="${chartBase - h}" width="${barW}" height="${h}" fill="${fills[i]}" rx="4"/>
<text x="${x + barW / 2}" y="${chartBase - h - 8}" text-anchor="middle" font-size="12" fill="${colors.ink}">${value}</text>`;
  }).join('\n') + `<text x="${x0 + barW * 1.5 + gap}" y="505" text-anchor="middle" font-size="13" fill="${colors.ink}">${label}</text>`;
}).join('\n')}
<text x="22" y="280" text-anchor="middle" font-size="14" fill="${colors.ink}" transform="rotate(-90 22 280)">Faradaic efficiency / %</text>
<circle cx="765" cy="96" r="6" fill="${colors.co2}"/><text x="782" y="101" font-size="13" fill="${colors.ink}">CO</text>
<circle cx="765" cy="124" r="6" fill="${colors.c2}"/><text x="782" y="129" font-size="13" fill="${colors.ink}">C2</text>
<circle cx="765" cy="152" r="6" fill="${colors.c3}"/><text x="782" y="157" font-size="13" fill="${colors.ink}">C3</text>
<text x="490" y="555" text-anchor="middle" font-size="13" fill="${colors.muted}">Synthetic planning data. Actual values must be replaced by GC/NMR quantification.</text>
</svg>`);

write('fig5_pathway_map.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="720" viewBox="0 0 1160 720" role="img" aria-labelledby="title desc">
<title id="title">Candidate C3 pathway map</title>
<desc id="desc">Mechanistic network for C3 formation on Cu/Ag/Ru catalysts with candidate validation methods.</desc>
<rect width="1160" height="720" fill="${colors.bg}"/>
<text x="48" y="54" font-size="28" font-weight="700" fill="${colors.ink}">Candidate routes to C3 oxygenates</text>
<text x="48" y="84" font-size="15" fill="${colors.muted}">Supplementary mechanism map: each route has a required experimental fingerprint</text>
${[
  ['CO2', 70, 180, colors.co2],
  ['*CO on Ag/Cu', 250, 180, colors.co2],
  ['*OCCO', 450, 130, colors.c2],
  ['C2 aldehyde pool', 645, 130, colors.c2],
  ['C2 + C1 coupling', 840, 130, colors.c3],
  ['C3 oxygenates', 1010, 210, colors.c3],
  ['Ru-H / water activation', 430, 325, colors.ru],
  ['Hydrogenated C2 intermediate', 675, 325, colors.ru],
  ['Local pH and CO coverage', 250, 500, colors.ink],
  ['Cu(100)/(111) interface', 525, 500, colors.cu],
  ['Flow-cell transport', 815, 500, colors.ink]
].map(([label, x, y, fill]) => `<rect x="${x}" y="${y}" width="142" height="58" rx="12" fill="white" stroke="${fill}" stroke-width="3"/>
<text x="${x + 71}" y="${y + 35}" text-anchor="middle" font-size="14" font-weight="700" fill="${fill}">${label}</text>`).join('\n')}
${[
  [212,209,250,209, colors.co2], [392,209,450,160, colors.co2], [592,160,645,160, colors.c2],
  [787,160,840,160, colors.c3], [982,160,1010,210, colors.c3], [572,354,675,354, colors.ru],
  [817,354,1010,238, colors.ru], [392,529,525,529, colors.cu], [667,529,815,529, colors.ink],
  [321,500,450,188, colors.ink], [886,500,1010,255, colors.ink]
].map(([x1, y1, x2, y2, color]) => `<path d="M${x1} ${y1} C${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" stroke="${color}" stroke-width="3" fill="none" marker-end="url(#arrow)"/>`).join('\n')}
<rect x="70" y="612" width="1020" height="48" rx="10" fill="#fff7ed" stroke="#fdba74"/>
<text x="580" y="642" text-anchor="middle" font-size="14" fill="#9a3412">Validation set: isotope labeling, operando Raman/SEIRAS, XAS/XPS, NMR/GC, pH transport mapping, and stability testing.</text>
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
  </marker>
</defs>
</svg>`);

console.log(`Generated T002 figures in ${figureDir}`);
