/**
 * Quiz renderers show options in the order written. Content authors tend to put the
 * correct answer first, so learners can game it. These helpers place the correct
 * option at a deterministic, varying slot (stable across renders and tests).
 */
export const moveCorrectTo = (options: string[], answer: number, target: number) => {
  const slot = ((target % options.length) + options.length) % options.length;
  const correct = options[answer];
  const rest = options.filter((_, i) => i !== answer);
  const reordered = [...rest.slice(0, slot), correct, ...rest.slice(slot)];
  return { options: reordered, answer: slot };
};

/** Give question i its correct answer at slot (offset + i) so answers cycle through every position. */
export const spreadAnswers = <T extends { options: string[]; answer: number }>(questions: T[], offset = 0): T[] =>
  questions.map((q, i) => ({ ...q, ...moveCorrectTo(q.options, q.answer, offset + i) }));
