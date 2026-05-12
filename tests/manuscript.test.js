const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('T002 manuscript package has required files', () => {
  const required = [
    'manuscript/manuscript.md',
    'manuscript/supplementary_pathways_and_experiments.md',
    'manuscript/references_to_retrieve.md',
    'manuscript/data/simulated_performance.json',
    'manuscript/figures/fig1_catalyst_concept.svg',
    'manuscript/figures/fig2_hcell_screening.svg',
    'manuscript/figures/fig3_flowcell_stability.svg',
    'manuscript/figures/fig4_modifier_comparison.svg',
    'manuscript/figures/fig5_pathway_map.svg'
  ];

  for (const file of required) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist`);
  }
});

test('T002 manuscript contains citations, figures, and simulation disclosure', () => {
  const manuscript = read('manuscript/manuscript.md');
  const citations = manuscript.match(/\[[A-Za-z0-9-]+20\d{2}[a-z]?\]/g) || [];

  assert.ok(citations.length >= 12, 'manuscript should contain at least 12 literature citations');
  assert.match(manuscript, /simulated/i);
  assert.match(manuscript, /Figure 1/);
  assert.match(manuscript, /H-cell/i);
  assert.match(manuscript, /flow cell/i);
  assert.match(manuscript, /C3/i);
});

test('T002 supplement maps each pathway to validation methods', () => {
  const supplement = read('manuscript/supplementary_pathways_and_experiments.md');
  for (const phrase of [
    'Pathway A',
    'Pathway B',
    'Pathway C',
    'Pathway D',
    'operando Raman',
    'ATR-SEIRAS',
    '13CO2',
    'NMR',
    'GC'
  ]) {
    assert.match(supplement, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
});
