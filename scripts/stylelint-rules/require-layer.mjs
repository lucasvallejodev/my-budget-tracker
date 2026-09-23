/**
 * Local Stylelint rule: every rule of the stylesheet sits inside `@layer <name>` or one of its
 * sublayers (`@layer ui.base`). Used for
 * `src/components/ui/**` so shared building blocks live in the `ui` cascade layer, which
 * `globals.scss` orders below unlayered feature styles: a feature component can override a
 * `ui` component with a plain class, without specificity hacks.
 */
import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'local/require-layer';

const messages = ruleMessages(ruleName, {
  outside: layer => `Wrap the stylesheet in "@layer ${layer} { … }".`,
});

const ModuleRules = new Set(['charset', 'forward', 'function', 'import', 'mixin', 'use']);

const isAllowedTopLevel = (node, layer) =>
  node.type === 'comment' ||
  (node.type === 'decl' && node.prop.startsWith('$')) ||
  (node.type === 'atrule' && ModuleRules.has(node.name)) ||
  (node.type === 'atrule' &&
    node.name === 'layer' &&
    (node.params.trim() === layer || node.params.trim().startsWith(`${layer}.`)));

const ruleFunction = layer => (root, result) => {
  if (
    !validateOptions(result, ruleName, {
      actual: layer,
      possible: [value => typeof value === 'string'],
    })
  ) {
    return;
  }

  for (const node of root.nodes.filter(child => !isAllowedTopLevel(child, layer))) {
    report({
      message: messages.outside(layer),
      node,
      result,
      ruleName,
    });
  }
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

export default createPlugin(ruleName, ruleFunction);
