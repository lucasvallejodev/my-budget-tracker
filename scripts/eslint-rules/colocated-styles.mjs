import path from 'node:path';

const StylesheetExtension = '.scss';
const SourceExtension = /\.(tsx?|jsx?)$/;
const TestFile = /\.test\.[jt]sx?$/;
const Whitespace = /\s+/;
const BemSeparators = ['__', '--'];

const baseName = filename => path.basename(filename).replace(SourceExtension, '');

const belongsToBlock = (className, block) =>
  className === block ||
  BemSeparators.some(separator => className.startsWith(`${block}${separator}`));

/**
 * Local ESLint rule for plain BEM class strings. A component imports only its own stylesheet,
 * named like the file (`metric-card.tsx` → `import './metric-card.scss'`), and every class string
 * it writes in `className` (or in a `…ClassNames` lookup table) belongs to that block:
 * `metric-card`, `metric-card__label`, `metric-card--compact`. Classes of another block are
 * reported, because a stylesheet only styles its own block.
 */
const ColocatedStylesRule = {
  create(context) {
    if (TestFile.test(context.filename)) return {};
    const block = baseName(context.filename);
    const expectedImport = `./${block}${StylesheetExtension}`;

    const checkClassNames = (node, text) => {
      for (const className of text.split(Whitespace).filter(Boolean)) {
        if (belongsToBlock(className, block)) continue;
        context.report({
          data: { block, className },
          messageId: 'foreignClass',
          node,
        });
      }
    };

    const checkStrings = node => {
      if (!node) return;

      if (node.type === 'Literal' && typeof node.value === 'string') {
        checkClassNames(node, node.value);
      }

      if (node.type === 'TemplateLiteral') checkClassNames(node, node.quasis[0].value.cooked ?? '');
      if (node.type === 'CallExpression') node.arguments.forEach(checkStrings);
      if (node.type === 'LogicalExpression') checkStrings(node.right);

      if (node.type === 'ConditionalExpression') {
        [node.consequent, node.alternate].forEach(checkStrings);
      }

      if (node.type === 'ObjectExpression') {
        node.properties.forEach(property => checkStrings(property.key));
      }
    };

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        if (typeof source !== 'string' || !source.endsWith(StylesheetExtension)) return;
        if (source === expectedImport) return;
        context.report({
          data: { expected: expectedImport, source },
          messageId: 'stylesheet',
          node: node.source,
        });
      },
      'JSXAttribute[name.name="className"]'(node) {
        if (node.value?.type === 'Literal') checkStrings(node.value);
        if (node.value?.type === 'JSXExpressionContainer') checkStrings(node.value.expression);
      },
      'VariableDeclarator[id.name=/ClassNames$/] > ObjectExpression'(node) {
        node.properties.forEach(property => {
          if (property.value?.type === 'Literal' && property.value.value) {
            checkStrings(property.value);
          }
        });
      },
    };
  },
  meta: {
    docs: {
      description:
        'A component imports only its own `<file>.scss` and writes class strings of the block named after the file.',
    },
    messages: {
      foreignClass:
        'Class "{{className}}" is not part of block "{{block}}". Use "{{block}}", "{{block}}__element" or "{{block}}--modifier"; style another component through its props.',
      stylesheet:
        'Import only the colocated stylesheet "{{expected}}", not "{{source}}". Reuse a look by rendering the component that owns it (see agents/components.md).',
    },
    schema: [],
    type: 'problem',
  },
};

export default ColocatedStylesRule;
