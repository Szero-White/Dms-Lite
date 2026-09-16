import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(frontendRoot, 'src');

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolute));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(absolute);
    }
  }

  return files;
}

async function collectStyleFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectStyleFiles(absolute));
    } else if (/\.css$/.test(entry.name)) {
      files.push(absolute);
    }
  }

  return files;
}

function flattenKeys(value, prefix = '', output = new Set()) {
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flattenKeys(child, next, output);
    } else {
      output.add(next);
    }
  }
  return output;
}

function relative(file) {
  return path.relative(frontendRoot, file).replaceAll(path.sep, '/');
}

const failures = [];
const sourceFiles = await collectFiles(srcRoot);
const sourceEntries = await Promise.all(
  sourceFiles.map(async (file) => [file, await readFile(file, 'utf8')]),
);
const styleFiles = await collectStyleFiles(srcRoot);
const styleEntries = await Promise.all(
  styleFiles.map(async (file) => [file, await readFile(file, 'utf8')]),
);

for (const [file, source] of sourceEntries) {
  if (source.includes('defaultSortOrder')) {
    failures.push(`${relative(file)}: defaultSortOrder would light a sorter on initial load.`);
  }

  if (/showSorterTooltip\s*=\s*\{false\}/.test(source)) {
    failures.push(`${relative(file)}: sortable headers must keep the shared professional tooltip.`);
  }

  if (
    relative(file) !== 'src/components/common/CheckboxMultiSelect/CheckboxMultiSelect.tsx'
    && /<Select[\s\S]{0,500}?mode=["']multiple["']/.test(source)
  ) {
    failures.push(`${relative(file)}: use CheckboxMultiSelect instead of a raw multi-select.`);
  }

  const tableCount = (source.match(/<Table(?:<|\s)/g) ?? []).length;
  if (tableCount > 0) {
    const sharedDirectionsCount = (source.match(/sortDirections=\{TABLE_SORT_DIRECTIONS\}/g) ?? []).length;
    const sharedTooltipCount = (source.match(/showSorterTooltip=\{TABLE_SORTER_TOOLTIP\}/g) ?? []).length;

    if (sharedDirectionsCount !== tableCount || sharedTooltipCount !== tableCount) {
      failures.push(
        `${relative(file)}: every data table must use the shared three-state sort cycle and sorter tooltip.`,
      );
    }
  }
}


for (const [file, source] of styleEntries) {
  if (/\.ant-table-sticky-scroll\s*\{[^}]*display\s*:\s*none/si.test(source)) {
    failures.push(`${relative(file)}: do not hide Ant Design horizontal table scrollbars.`);
  }
}

const legacyPresetTagPattern = /color=[{]?['"](?:blue|geekblue|purple|magenta|cyan)['"]/g;
for (const [file, source] of sourceEntries) {
  if (legacyPresetTagPattern.test(source)) {
    failures.push(`${relative(file)}: avoid decorative preset tag colors; use neutral or semantic status styling.`);
  }
}

const legacyPalettePattern = /#(?:3f6f68|345f58|2b514b|294b46|4f46e5|4338ca|3730a3|6366f1|5b4df6|7c67ff|735df6|795ff5|f58bd5|fb7fd4)\b/i;
for (const [file, source] of styleEntries) {
  if (legacyPalettePattern.test(source)) {
    failures.push(`${relative(file)}: legacy sage, blue, or neon decorative palette is not allowed.`);
  }
}

const nearBlackUiPattern = /#(?:000000|111111|171717|1f1f1f|222222|262626|2b2b2b)\b/i;
for (const [file, source] of styleEntries) {
  if (nearBlackUiPattern.test(source)) {
    failures.push(`${relative(file)}: use the shared slate text tokens instead of near-black UI colors.`);
  }
}

const viPath = path.join(srcRoot, 'i18n/locales/vi.json');
const enPath = path.join(srcRoot, 'i18n/locales/en.json');
const vi = JSON.parse(await readFile(viPath, 'utf8'));
const en = JSON.parse(await readFile(enPath, 'utf8'));
const viKeys = flattenKeys(vi);
const enKeys = flattenKeys(en);

for (const key of viKeys) {
  if (!enKeys.has(key)) failures.push(`Missing EN translation key: ${key}`);
}
for (const key of enKeys) {
  if (!viKeys.has(key)) failures.push(`Missing VI translation key: ${key}`);
}

const literalTranslationPattern = /\bt\(\s*['"]([^'"]+)['"]/g;
for (const [file, source] of sourceEntries) {
  for (const match of source.matchAll(literalTranslationPattern)) {
    const key = match[1];
    if (!viKeys.has(key) || !enKeys.has(key)) {
      failures.push(`${relative(file)}: literal translation key is missing in VI/EN: ${key}`);
    }
  }
}

if (failures.length > 0) {
  console.error('UI consistency audit: FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`UI consistency audit: PASS (${sourceFiles.length} TS/TSX files, ${styleFiles.length} CSS files, ${viKeys.size} VI/EN keys)`);
  console.log('Rules checked: neutral initial sort, shared table sort cycle/tooltips, visible horizontal table overflow, checkbox multi-select, visual palette guardrails, VI/EN parity.');
}
