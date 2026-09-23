import { RuleTester } from 'eslint';
import { afterAll, describe, it } from 'vitest';

import colocatedStyles from './colocated-styles.mjs';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    parserOptions: { ecmaFeatures: { jsx: true } },
    sourceType: 'module',
  },
});

const filename = 'src/components/ui/badge/badge.tsx';

ruleTester.run('colocated-styles', colocatedStyles, {
  invalid: [
    {
      code: "import '../panel/panel.scss';",
      errors: [{ messageId: 'stylesheet' }],
      filename,
    },
    {
      code: "import styles from './badge.module.scss';",
      errors: [{ messageId: 'stylesheet' }],
      filename,
    },
    {
      code: 'const view = <span className="panel__title" />;',
      errors: [{ messageId: 'foreignClass' }],
      filename,
    },
    {
      code: 'const view = <span className="muted" />;',
      errors: [{ messageId: 'foreignClass' }],
      filename,
    },
    {
      code: "const view = <span className={cn('badge', { 'text--muted': quiet })} />;",
      errors: [{ messageId: 'foreignClass' }],
      filename,
    },
    {
      code: "const ToneClassNames = { danger: 'panel--danger' };",
      errors: [{ messageId: 'foreignClass' }],
      filename,
    },
  ],
  valid: [
    { code: "import './badge.scss';", filename },
    { code: 'const view = <span className="badge__dot" />;', filename },
    {
      code: "const view = <span className={cn('badge', danger && 'badge--danger', { 'badge--pulse': on }, className)} />;",
      filename,
    },
    { code: "const ToneClassNames = { danger: 'badge--danger', success: '' };", filename },
    {
      code: 'const name = `badge__${part}`;\nconst view = <span className={`badge__${part}`} />;',
      filename,
    },
    {
      code: 'const view = <span className="panel" />;',
      filename: 'src/components/ui/badge/badge.test.tsx',
    },
  ],
});
