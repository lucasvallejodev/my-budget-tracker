/**
 * Local Stylelint rule: a component stylesheet holds exactly one BEM block, named after the
 * file (`metric-card.scss` → `.metric-card`). Class names are global, so this is what keeps them
 * unique. Every class in every selector, after
 * resolving `&` nesting, must be that block, one of its elements (`block__element`) or a
 * modifier (`block--modifier`, `block__element--modifier`). Classes of other blocks are
 * reported: style another component through its props, not by reaching into it.
 */
import path from 'node:path';
import selectorParser from 'postcss-selector-parser';
import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'local/bem-block-matches-file';

const messages = ruleMessages(ruleName, {
  foreign: (className, block) =>
    `Class ".${className}" does not belong to block ".${block}". A stylesheet styles only its own block (the file name); use the other component's props or add a modifier.`,
  missingBlock: block =>
    `Stylesheet defines no class of block ".${block}". The block must match the file name.`,
});

const StylesheetSuffix = '.scss';

const blockFromFile = file => {
  const base = path.basename(file ?? '');

  return base.endsWith(StylesheetSuffix) ? base.slice(0, -StylesheetSuffix.length) : null;
};

const closestRule = node => {
  let current = node.parent;

  while (current && current.type !== 'root') {
    if (current.type === 'rule') return current;
    current = current.parent;
  }

  return null;
};

const insideKeyframes = node => {
  let current = node.parent;

  while (current && current.type !== 'root') {
    if (current.type === 'atrule' && current.name.endsWith('keyframes')) return true;
    current = current.parent;
  }

  return false;
};

const resolveSelectors = rule => {
  const parent = closestRule(rule);

  if (!parent) return rule.selectors;
  const parentSelectors = resolveSelectors(parent);

  return parentSelectors.flatMap(parentSelector =>
    rule.selectors.map(selector =>
      selector.includes('&')
        ? selector.replaceAll('&', parentSelector)
        : `${parentSelector} ${selector}`
    )
  );
};

const classNames = selector => {
  const names = [];

  selectorParser(root => root.walkClasses(node => names.push(node.value))).processSync(selector);

  return names;
};

const belongsToBlock = (className, block) =>
  className === block || className.startsWith(`${block}__`) || className.startsWith(`${block}--`);

const ruleFunction = primary => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary, possible: [true] })) return;
  const block = blockFromFile(root.source?.input.file);

  if (!block) return;
  let hasBlockRule = false;

  root.walkRules(rule => {
    if (insideKeyframes(rule)) return;

    for (const selector of resolveSelectors(rule)) {
      const classes = classNames(selector);

      if (classes.some(name => belongsToBlock(name, block))) hasBlockRule = true;

      for (const className of classes.filter(name => !belongsToBlock(name, block))) {
        report({
          message: messages.foreign(className, block),
          node: rule,
          result,
          ruleName,
        });
      }
    }
  });

  if (!hasBlockRule) {
    report({
      message: messages.missingBlock(block),
      node: root,
      result,
      ruleName,
    });
  }
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

export default createPlugin(ruleName, ruleFunction);
