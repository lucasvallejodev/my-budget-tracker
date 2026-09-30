// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { compile } from 'sass';
import { describe, expect, it } from 'vitest';

import { ChartStyle, Colors } from './theme';

const StylesRoot = import.meta.dirname;
const SourceRoot = path.join(StylesRoot, '..');
const DeclaredProperty = /^ *(--[a-z0-9-]+): ([^;\n]+);$/gm;
const UsedProperty = /var\((--[a-z0-9-]+)/g;
const OpaqueColour = /^(#[0-9a-f]{6}|rgb\(\d+, \d+, \d+\))$/;
const SourceFile = /\.(scss|tsx?)$/;
const ExternalProperties = ['--font-inter', '--radix-'];

const compiledTokens = () =>
  compile(path.join(StylesRoot, 'tokens.scss'), { loadPaths: [StylesRoot] }).css;

const declaredProperties = () =>
  new Map([...compiledTokens().matchAll(DeclaredProperty)].map(match => [match[1], match[2]]));

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap(entry => {
    const entryPath = path.join(directory, entry);

    if (statSync(entryPath).isDirectory()) return sourceFiles(entryPath);

    return SourceFile.test(entry) && !entry.endsWith('.test.ts') ? [entryPath] : [];
  });

const isExternal = (property: string) =>
  ExternalProperties.some(prefix => property.startsWith(prefix));

describe('theme', () => {
  it('emits the brand colour and its derived family as custom properties', () => {
    const properties = declaredProperties();

    expect(properties.get('--color-brand')).toBe('#6941c6');
    expect(properties.get('--color-brand-hover')).toMatch(OpaqueColour);
    expect(properties.get('--color-brand-soft')).toMatch(OpaqueColour);
    expect(properties.get('--font-sans')).toContain('var(--font-inter)');
    expect(properties.get('--radius-card')).toBe('12px');
  });

  it('defines every custom property the web app references', () => {
    const files = sourceFiles(SourceRoot);
    const contents = files.map(file => readFileSync(file, 'utf8'));

    const properties = declaredProperties();

    const isDeclaredPrefix = (property: string) =>
      property.endsWith('-') && [...properties.keys()].some(name => name.startsWith(property));

    const isAssigned = (property: string) =>
      isDeclaredPrefix(property) ||
      contents.some(
        content => content.includes(`${property}:`) || content.includes(`'${property}':`)
      );

    const missing = files.flatMap(file =>
      [...readFileSync(file, 'utf8').matchAll(UsedProperty)]
        .map(match => match[1])
        .filter(
          property => !properties.has(property) && !isExternal(property) && !isAssigned(property)
        )
        .map(property => `${path.relative(SourceRoot, file)}: ${property}`)
    );

    expect(missing).toEqual([]);
  });

  it('keeps TypeScript colours as references to theme variables', () => {
    const values = [
      Colors.brand,
      ...Object.values(Colors.chart),
      ChartStyle.grid,
      ...Object.values(ChartStyle.tooltip),
    ];

    expect(values.every(value => value.includes('var(--'))).toBe(true);
  });
});
