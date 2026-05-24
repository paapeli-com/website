#!/usr/bin/env node
// Regenerate icons.css and icon-names.ts from the icomoon JSON
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, 'src');

const data = JSON.parse(readFileSync(join(src, 'untitled-project.icomoon.json'), 'utf8'));
const glyphs = data.glyphs ?? [];

// icons.css — one ::before rule per icon
const cssLines = glyphs.map(({ extras: { name, codePoint } }) => {
  const hex = codePoint.toString(16);
  return `.icon-${name}::before { content: "\\${hex}"; }`;
});
writeFileSync(join(src, 'icons.css'), cssLines.join('\n') + '\n');

// icon-names.ts — runtime array + union type for type-safe icon names
const typeLines = ['export const ICON_NAMES = ['];
glyphs.forEach(({ extras: { name } }) => {
  typeLines.push(`  "${name}",`);
});
typeLines.push('] as const;', '', 'export type IconName = typeof ICON_NAMES[number];', '');
writeFileSync(join(src, 'icon-names.ts'), typeLines.join('\n'));

console.log(`Generated ${glyphs.length} icon entries.`);
