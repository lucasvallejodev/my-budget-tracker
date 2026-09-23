const AllowedCommentPatterns = [
  /^\s*eslint-/,
  /^\s*eslint /,
  /^\s*@ts-/,
  /^\s*keep order/,
  /^\s*@vitest-environment/,
];

const NoCommentsRule = {
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const allowed = AllowedCommentPatterns.some(pattern => pattern.test(comment.value));

          if (!allowed) context.report({ loc: comment.loc, messageId: 'comment' });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        'Code explains itself through names; comments are reserved for tool directives and `keep order` markers.',
    },
    messages: {
      comment:
        'Comments are not allowed. Express the intent with a descriptive constant, function or type name instead.',
    },
    schema: [],
    type: 'suggestion',
  },
};

export default NoCommentsRule;
