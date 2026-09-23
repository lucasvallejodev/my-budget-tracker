import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';

const BemConfig = {
  customSyntax: 'postcss-scss',
  plugins: ['./scripts/stylelint-rules/bem-block-matches-file.mjs'],
  rules: { 'local/bem-block-matches-file': true },
};

const LayerConfig = {
  customSyntax: 'postcss-scss',
  plugins: ['./scripts/stylelint-rules/require-layer.mjs'],
  rules: { 'local/require-layer': 'ui' },
};

const lint = async (code, config, codeFilename = 'src/components/ui/badge/badge.scss') => {
  const { results } = await stylelint.lint({
    code,
    codeFilename,
    config,
  });

  return results[0].warnings.map(warning => warning.rule);
};

describe('local/bem-block-matches-file', () => {
  it('accepts the block, its elements and modifiers, nested or not', async () => {
    const code = `.badge {
  color: red;

  &__dot { color: blue; }

  &--danger { color: green; }

  &:hover &__dot { color: pink; }
}

.badge__dot--pulse { opacity: 0.5; }

@keyframes pulse { to { opacity: 0; } }`;

    expect(await lint(code, BemConfig)).toEqual([]);
  });

  it('reports classes of another block', async () => {
    expect(await lint('.badge { color: red; }\n.panel__title { color: blue; }', BemConfig)).toEqual(
      ['local/bem-block-matches-file']
    );
    expect(await lint('.badge { .muted { color: red; } }', BemConfig)).toEqual([
      'local/bem-block-matches-file',
    ]);
  });

  it('reports a stylesheet without any class of its block', async () => {
    expect(await lint('.badge__dot { color: red; }', BemConfig)).toEqual([]);
    expect(await lint('@keyframes spin { to { opacity: 0; } }', BemConfig)).toEqual([
      'local/bem-block-matches-file',
    ]);
  });

  it('ignores files that are not stylesheets', async () => {
    expect(await lint('.anything { color: red; }', BemConfig, 'src/app/globals.css')).toEqual([]);
  });
});

describe('local/require-layer', () => {
  it('accepts module rules and the configured layer', async () => {
    expect(
      await lint("@use 'abstracts' as *;\n\n@layer ui {\n  .badge { color: red; }\n}", LayerConfig)
    ).toEqual([]);
    expect(await lint('@layer ui.base { .badge { color: red; } }', LayerConfig)).toEqual([]);
  });

  it('reports rules outside the layer', async () => {
    expect(await lint('.badge { color: red; }', LayerConfig)).toEqual(['local/require-layer']);
    expect(await lint('@layer other { .badge { color: red; } }', LayerConfig)).toEqual([
      'local/require-layer',
    ]);
  });
});
