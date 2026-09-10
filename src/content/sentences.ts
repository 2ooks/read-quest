// Decodable sentence templates for "Read to me" and the nightly printable.
// Slots: {n} noun, {n2} second noun, {v} verb, {adj} adjective, {nm} name.
// Fixed words in a template must be decodable or a taught tricky word —
// the composer checks each template against the learner's current knowledge.

export interface SentenceTemplate {
  t: string;
  /** Minimum GPC set that should be reached before this template is used. */
  minSet: number;
}

export const SENTENCE_TEMPLATES: SentenceTemplate[] = [
  { t: 'a {n}', minSet: 2 },
  { t: 'a {adj} {n}', minSet: 2 },
  { t: 'the {n}', minSet: 2 },
  { t: '{nm} sat.', minSet: 2 },
  { t: 'it is a {n}.', minSet: 2 },
  { t: 'the {n} is {adj}.', minSet: 2 },
  { t: '{nm} is {adj}.', minSet: 2 },
  { t: '{nm} can {v}.', minSet: 3 },
  { t: 'I can {v}.', minSet: 3 },
  { t: 'a {n} and a {n2}.', minSet: 2 },
  { t: 'the {n} is in the {n2}.', minSet: 2 },
  { t: 'the {n} is on the {n2}.', minSet: 3 },
  { t: '{nm} has a {n}.', minSet: 5 },
  { t: 'the {n} can {v}.', minSet: 3 },
  { t: 'I see a {adj} {n}.', minSet: 8 },
  { t: '{nm} and {nm2} {v}.', minSet: 3 },
  { t: 'the {adj} {n} is in the {n2}.', minSet: 3 },
];
