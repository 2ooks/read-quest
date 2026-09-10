// Decodable word bank. Each word carries its grapheme parse (GPC ids), an
// optional emoji picture (native emoji renders beautifully on iPad), a
// part-of-speech tag for sentence templates, and a rough frequency tier
// (1 = very common early word, 3 = less common).
//
// Rules for emoji: only well-established emoji (<= Emoji 13, iOS 14.2), and a
// picture should be unambiguous — a 4-year-old naming the picture should say
// the word.

export type Pos = 'n' | 'v' | 'adj' | 'nm' | 'o';

export interface Word {
  w: string;
  g: string[];
  emoji?: string;
  pos: Pos;
  freq: 1 | 2 | 3;
}

function W(w: string, parse: string, pos: Pos, freq: 1 | 2 | 3, emoji?: string): Word {
  return { w, g: parse.split('-'), pos, freq, emoji };
}

export const WORDS: Word[] = [
  // ---- Set 1: s a t p
  W('sat', 's-a-t', 'v', 1), W('tap', 't-a-p', 'v', 1), W('pat', 'p-a-t', 'v', 2), W('at', 'a-t', 'o', 1),
  W('sap', 's-a-p', 'n', 3), W('taps', 't-a-p-s', 'v', 3), W('pats', 'p-a-t-s', 'v', 3),
  // ---- Set 2: + i n m d
  W('sit', 's-i-t', 'v', 1), W('tin', 't-i-n', 'n', 2), W('pin', 'p-i-n', 'n', 1, '📌'), W('pit', 'p-i-t', 'n', 2),
  W('tip', 't-i-p', 'n', 2), W('nip', 'n-i-p', 'v', 3), W('sip', 's-i-p', 'v', 2), W('dip', 'd-i-p', 'v', 2),
  W('mat', 'm-a-t', 'n', 1), W('man', 'm-a-n', 'n', 1), W('map', 'm-a-p', 'n', 1, '🗺️'), W('nap', 'n-a-p', 'v', 1, '😴'),
  W('pan', 'p-a-n', 'n', 1, '🍳'), W('tan', 't-a-n', 'adj', 3), W('dad', 'd-a-d', 'n', 1, '👨'), W('sad', 's-a-d', 'adj', 1, '😢'),
  W('mad', 'm-a-d', 'adj', 1, '😠'), W('dim', 'd-i-m', 'adj', 3), W('did', 'd-i-d', 'o', 1), W('it', 'i-t', 'o', 1),
  W('in', 'i-n', 'o', 1), W('an', 'a-n', 'o', 1), W('am', 'a-m', 'o', 1), W('and', 'a-n-d', 'o', 1),
  W('pad', 'p-a-d', 'n', 3), W('Sam', 's-a-m', 'nm', 1), W('Tim', 't-i-m', 'nm', 1), W('Pam', 'p-a-m', 'nm', 2),
  W('Dan', 'd-a-n', 'nm', 2), W('ant', 'a-n-t', 'n', 2, '🐜'), W('tins', 't-i-n-s', 'n', 3), W('naps', 'n-a-p-s', 'v', 3),
  // ---- Set 3: + g o c k
  W('got', 'g-o-t', 'v', 1), W('dog', 'd-o-g', 'n', 1, '🐶'), W('cot', 'c-o-t', 'n', 3), W('cop', 'c-o-p', 'n', 3),
  W('top', 't-o-p', 'n', 1), W('pot', 'p-o-t', 'n', 1, '🍲'), W('mop', 'm-o-p', 'n', 2, '🧹'), W('pop', 'p-o-p', 'v', 2),
  W('cat', 'c-a-t', 'n', 1, '🐱'), W('can', 'c-a-n', 'o', 1), W('cap', 'c-a-p', 'n', 1, '🧢'), W('kid', 'k-i-d', 'n', 1, '🧒'),
  W('kit', 'k-i-t', 'n', 3), W('gap', 'g-a-p', 'n', 3), W('gas', 'g-a-s', 'n', 3), W('dig', 'd-i-g', 'v', 1, '⛏️'),
  W('pig', 'p-i-g', 'n', 1, '🐷'), W('not', 'n-o-t', 'o', 1), W('dot', 'd-o-t', 'n', 2), W('on', 'o-n', 'o', 1),
  W('cod', 'c-o-d', 'n', 3), W('nod', 'n-o-d', 'v', 3), W('mom', 'm-o-m', 'n', 1, '👩'), W('Kim', 'k-i-m', 'nm', 2),
  W('Tom', 't-o-m', 'nm', 1), W('dogs', 'd-o-g-s', 'n', 2), W('cats', 'c-a-t-s', 'n', 2), W('pigs', 'p-i-g-s', 'n', 2),
  // ---- Set 4: + ck e u r
  W('duck', 'd-u-ck', 'n', 1, '🦆'), W('kick', 'k-i-ck', 'v', 1), W('pick', 'p-i-ck', 'v', 2), W('pack', 'p-a-ck', 'v', 2),
  W('sack', 's-a-ck', 'n', 3), W('neck', 'n-e-ck', 'n', 2), W('peck', 'p-e-ck', 'v', 3), W('deck', 'd-e-ck', 'n', 3),
  W('tuck', 't-u-ck', 'v', 3), W('rock', 'r-o-ck', 'n', 1, '🪨'), W('sock', 's-o-ck', 'n', 1, '🧦'), W('tick', 't-i-ck', 'n', 3),
  W('pet', 'p-e-t', 'n', 1, '🐹'), W('ten', 't-e-n', 'n', 1, '🔟'), W('net', 'n-e-t', 'n', 2, '🥅'), W('pen', 'p-e-n', 'n', 1, '🖊️'),
  W('men', 'm-e-n', 'n', 2), W('get', 'g-e-t', 'v', 1), W('set', 's-e-t', 'v', 2), W('peg', 'p-e-g', 'n', 3),
  W('den', 'd-e-n', 'n', 3), W('red', 'r-e-d', 'adj', 1, '🔴'), W('rat', 'r-a-t', 'n', 2, '🐀'), W('ram', 'r-a-m', 'n', 3),
  W('rip', 'r-i-p', 'v', 3), W('rod', 'r-o-d', 'n', 3), W('rug', 'r-u-g', 'n', 2), W('run', 'r-u-n', 'v', 1, '🏃'),
  W('rot', 'r-o-t', 'v', 3), W('up', 'u-p', 'o', 1), W('cup', 'c-u-p', 'n', 1, '☕'), W('cut', 'c-u-t', 'v', 1, '✂️'),
  W('mud', 'm-u-d', 'n', 1), W('mug', 'm-u-g', 'n', 2), W('sun', 's-u-n', 'n', 1, '☀️'), W('nut', 'n-u-t', 'n', 2, '🥜'),
  W('tug', 't-u-g', 'v', 3), W('gum', 'g-u-m', 'n', 3), W('sum', 's-u-m', 'n', 3), W('us', 'u-s', 'o', 1),
  W('rocket', 'r-o-ck-e-t', 'n', 2, '🚀'), W('Meg', 'm-e-g', 'nm', 2), W('Ted', 't-e-d', 'nm', 2), W('Gus', 'g-u-s', 'nm', 3),
  W('ducks', 'd-u-ck-s', 'n', 2), W('cups', 'c-u-p-s', 'n', 2), W('pets', 'p-e-t-s', 'n', 2),
  // ---- Set 5: + h b f ff l ll ss
  W('hat', 'h-a-t', 'n', 1, '🎩'), W('him', 'h-i-m', 'o', 1), W('hot', 'h-o-t', 'adj', 1, '🔥'), W('hit', 'h-i-t', 'v', 2),
  W('hen', 'h-e-n', 'n', 1, '🐔'), W('hop', 'h-o-p', 'v', 1), W('hug', 'h-u-g', 'v', 1, '🤗'), W('hum', 'h-u-m', 'v', 2),
  W('hip', 'h-i-p', 'n', 3), W('hut', 'h-u-t', 'n', 2, '🛖'), W('bag', 'b-a-g', 'n', 1, '👜'), W('bat', 'b-a-t', 'n', 1, '🦇'),
  W('bed', 'b-e-d', 'n', 1, '🛏️'), W('bet', 'b-e-t', 'v', 3), W('big', 'b-i-g', 'adj', 1), W('bin', 'b-i-n', 'n', 2),
  W('bit', 'b-i-t', 'n', 2), W('bud', 'b-u-d', 'n', 3), W('bug', 'b-u-g', 'n', 1, '🐛'), W('bun', 'b-u-n', 'n', 2),
  W('bus', 'b-u-s', 'n', 1, '🚌'), W('but', 'b-u-t', 'o', 1), W('bad', 'b-a-d', 'adj', 1), W('bib', 'b-i-b', 'n', 3),
  W('Bob', 'b-o-b', 'nm', 1), W('cab', 'c-a-b', 'n', 3, '🚕'), W('cub', 'c-u-b', 'n', 2), W('rub', 'r-u-b', 'v', 2),
  W('tub', 't-u-b', 'n', 2), W('sob', 's-o-b', 'v', 3), W('rob', 'r-o-b', 'v', 3), W('fan', 'f-a-n', 'n', 2),
  W('fat', 'f-a-t', 'adj', 2), W('fit', 'f-i-t', 'v', 2), W('fin', 'f-i-n', 'n', 3), W('fig', 'f-i-g', 'n', 3),
  W('fog', 'f-o-g', 'n', 2, '🌫️'), W('fun', 'f-u-n', 'adj', 1), W('fed', 'f-e-d', 'v', 2), W('fell', 'f-e-ll', 'v', 2),
  W('fill', 'f-i-ll', 'v', 2), W('huff', 'h-u-ff', 'v', 3), W('puff', 'p-u-ff', 'v', 2, '💨'), W('off', 'o-ff', 'o', 1),
  W('cuff', 'c-u-ff', 'n', 3), W('lap', 'l-a-p', 'n', 2), W('leg', 'l-e-g', 'n', 1, '🦵'), W('let', 'l-e-t', 'v', 1),
  W('lid', 'l-i-d', 'n', 2), W('lip', 'l-i-p', 'n', 2, '👄'), W('lit', 'l-i-t', 'v', 3), W('log', 'l-o-g', 'n', 1, '🪵'),
  W('lot', 'l-o-t', 'o', 1), W('luck', 'l-u-ck', 'n', 2, '🍀'), W('lick', 'l-i-ck', 'v', 2, '👅'), W('lock', 'l-o-ck', 'n', 1, '🔒'),
  W('doll', 'd-o-ll', 'n', 1, '🪆'), W('bell', 'b-e-ll', 'n', 1, '🔔'), W('tell', 't-e-ll', 'v', 1), W('hill', 'h-i-ll', 'n', 1, '⛰️'),
  W('pill', 'p-i-ll', 'n', 3, '💊'), W('sell', 's-e-ll', 'v', 2), W('hiss', 'h-i-ss', 'v', 2, '🐍'), W('kiss', 'k-i-ss', 'v', 1, '💋'),
  W('mess', 'm-e-ss', 'n', 1), W('less', 'l-e-ss', 'o', 2), W('fuss', 'f-u-ss', 'n', 3), W('miss', 'm-i-ss', 'v', 1),
  W('boss', 'b-o-ss', 'n', 3), W('moss', 'm-o-ss', 'n', 3), W('Bill', 'b-i-ll', 'nm', 2), W('Nell', 'n-e-ll', 'nm', 3),
  W('rabbit', 'r-a-bb-i-t', 'n', 1, '🐰'), W('hats', 'h-a-t-s', 'n', 2), W('bugs', 'b-u-g-s', 'n', 2), W('legs', 'l-e-g-s', 'n', 2),
  // ---- Set 6: + j v w x y z zz qu
  W('jam', 'j-a-m', 'n', 1), W('jet', 'j-e-t', 'n', 1, '✈️'), W('jog', 'j-o-g', 'v', 2), W('jug', 'j-u-g', 'n', 2),
  W('job', 'j-o-b', 'n', 2), W('jab', 'j-a-b', 'v', 3), W('van', 'v-a-n', 'n', 1, '🚐'), W('vet', 'v-e-t', 'n', 2, '👩‍⚕️'),
  W('vat', 'v-a-t', 'n', 3), W('wet', 'w-e-t', 'adj', 1, '💧'), W('wig', 'w-i-g', 'n', 2), W('win', 'w-i-n', 'v', 1, '🏆'),
  W('web', 'w-e-b', 'n', 2, '🕸️'), W('wax', 'w-a-x', 'n', 3), W('wag', 'w-a-g', 'v', 2), W('box', 'b-o-x', 'n', 1, '📦'),
  W('fox', 'f-o-x', 'n', 1, '🦊'), W('fix', 'f-i-x', 'v', 2, '🔧'), W('six', 's-i-x', 'n', 1, '6️⃣'), W('mix', 'm-i-x', 'v', 2, '🥣'),
  W('yes', 'y-e-s', 'o', 1), W('yet', 'y-e-t', 'o', 2), W('yak', 'y-a-k', 'n', 3), W('yap', 'y-a-p', 'v', 3),
  W('yum', 'y-u-m', 'o', 1, '😋'), W('zip', 'z-i-p', 'v', 2), W('zap', 'z-a-p', 'v', 2, '⚡'), W('zigzag', 'z-i-g-z-a-g', 'n', 3),
  W('buzz', 'b-u-zz', 'v', 1), W('fizz', 'f-i-zz', 'v', 2), W('jazz', 'j-a-zz', 'n', 3), W('quit', 'qu-i-t', 'v', 2),
  W('quiz', 'qu-i-z', 'n', 2), W('quick', 'qu-i-ck', 'adj', 1), W('quack', 'qu-a-ck', 'v', 1), W('Max', 'm-a-x', 'nm', 1),
  W('Jill', 'j-i-ll', 'nm', 2), W('Jack', 'j-a-ck', 'nm', 1), W('Zak', 'z-a-k', 'nm', 3), W('Viv', 'v-i-v', 'nm', 3),
  // ---- Set 7: + ch sh th ng
  W('chip', 'ch-i-p', 'n', 1, '🍟'), W('chop', 'ch-o-p', 'v', 2, '🔪'), W('chin', 'ch-i-n', 'n', 2), W('chat', 'ch-a-t', 'v', 2),
  W('chug', 'ch-u-g', 'v', 3), W('rich', 'r-i-ch', 'adj', 2, '💰'), W('much', 'm-u-ch', 'o', 1), W('such', 's-u-ch', 'o', 2),
  W('chick', 'ch-i-ck', 'n', 1, '🐤'), W('check', 'ch-e-ck', 'v', 2), W('shop', 'sh-o-p', 'n', 1, '🏪'), W('ship', 'sh-i-p', 'n', 1, '🚢'),
  W('shed', 'sh-e-d', 'n', 2), W('shin', 'sh-i-n', 'n', 3), W('shut', 'sh-u-t', 'v', 1), W('shell', 'sh-e-ll', 'n', 2, '🐚'),
  W('fish', 'f-i-sh', 'n', 1, '🐟'), W('dish', 'd-i-sh', 'n', 2, '🍽️'), W('wish', 'w-i-sh', 'v', 1), W('rush', 'r-u-sh', 'v', 2),
  W('hush', 'h-u-sh', 'v', 2, '🤫'), W('cash', 'c-a-sh', 'n', 3, '💵'), W('dash', 'd-a-sh', 'v', 3), W('mash', 'm-a-sh', 'v', 3),
  W('shock', 'sh-o-ck', 'n', 3, '😲'), W('thin', 'th-i-n', 'adj', 2), W('thick', 'th-i-ck', 'adj', 2), W('thud', 'th-u-d', 'n', 3),
  W('moth', 'm-o-th', 'n', 2), W('bath', 'b-a-th', 'n', 1, '🛁'), W('path', 'p-a-th', 'n', 2), W('with', 'w-i-th', 'o', 1),
  W('math', 'm-a-th', 'n', 2), W('ring', 'r-i-ng', 'n', 1, '💍'), W('sing', 's-i-ng', 'v', 1, '🎤'), W('king', 'k-i-ng', 'n', 1, '🤴'),
  W('wing', 'w-i-ng', 'n', 2), W('long', 'l-o-ng', 'adj', 1), W('song', 's-o-ng', 'n', 1, '🎵'), W('bang', 'b-a-ng', 'n', 2, '💥'),
  W('hang', 'h-a-ng', 'v', 2), W('rang', 'r-a-ng', 'v', 2), W('sung', 's-u-ng', 'v', 3), W('lung', 'l-u-ng', 'n', 3),
  W('hung', 'h-u-ng', 'v', 3), W('gong', 'g-o-ng', 'n', 3), W('thing', 'th-i-ng', 'n', 1), W('rocking', 'r-o-ck-i-ng', 'v', 3),
  W('Chad', 'ch-a-d', 'nm', 3), W('Beth', 'b-e-th', 'nm', 2), W('Seth', 's-e-th', 'nm', 3), W('Josh', 'j-o-sh', 'nm', 2),
  // ---- Phase 4: adjacent consonants (no new GPCs; eligible once sets 1–5 are solid)
  W('hand', 'h-a-n-d', 'n', 1, '✋'), W('land', 'l-a-n-d', 'n', 2), W('sand', 's-a-n-d', 'n', 1, '🏖️'), W('band', 'b-a-n-d', 'n', 2, '🎸'),
  W('bend', 'b-e-n-d', 'v', 2), W('send', 's-e-n-d', 'v', 2), W('tent', 't-e-n-t', 'n', 1, '⛺'), W('went', 'w-e-n-t', 'v', 1),
  W('hunt', 'h-u-n-t', 'v', 2), W('bump', 'b-u-m-p', 'v', 2), W('jump', 'j-u-m-p', 'v', 1, '🤸'), W('lamp', 'l-a-m-p', 'n', 1),
  W('camp', 'c-a-m-p', 'n', 2, '🏕️'), W('damp', 'd-a-m-p', 'adj', 3), W('pump', 'p-u-m-p', 'n', 3), W('milk', 'm-i-l-k', 'n', 1, '🥛'),
  W('help', 'h-e-l-p', 'v', 1), W('belt', 'b-e-l-t', 'n', 2), W('melt', 'm-e-l-t', 'v', 2), W('gift', 'g-i-f-t', 'n', 1, '🎁'),
  W('lift', 'l-i-f-t', 'v', 2), W('soft', 's-o-f-t', 'adj', 1), W('left', 'l-e-f-t', 'o', 1), W('nest', 'n-e-s-t', 'n', 1),
  W('best', 'b-e-s-t', 'adj', 1, '🥇'), W('rest', 'r-e-s-t', 'v', 2), W('test', 't-e-s-t', 'n', 2), W('vest', 'v-e-s-t', 'n', 2),
  W('fist', 'f-i-s-t', 'n', 2, '✊'), W('list', 'l-i-s-t', 'n', 2, '📝'), W('must', 'm-u-s-t', 'o', 1), W('dust', 'd-u-s-t', 'n', 2),
  W('just', 'j-u-s-t', 'o', 1), W('lost', 'l-o-s-t', 'adj', 1), W('desk', 'd-e-s-k', 'n', 2), W('mask', 'm-a-s-k', 'n', 2, '🎭'),
  W('pond', 'p-o-n-d', 'n', 2), W('wind', 'w-i-n-d', 'n', 1, '🌬️'), W('pink', 'p-i-n-k', 'adj', 1), W('sink', 's-i-n-k', 'n', 2),
  W('wink', 'w-i-n-k', 'v', 2, '😉'), W('tank', 't-a-n-k', 'n', 3), W('honk', 'h-o-n-k', 'v', 3), W('junk', 'j-u-n-k', 'n', 3),
  W('stop', 's-t-o-p', 'v', 1, '🛑'), W('step', 's-t-e-p', 'n', 2), W('spot', 's-p-o-t', 'n', 2), W('spin', 's-p-i-n', 'v', 2),
  W('snap', 's-n-a-p', 'v', 2), W('snug', 's-n-u-g', 'adj', 3), W('slip', 's-l-i-p', 'v', 2), W('slug', 's-l-u-g', 'n', 3),
  W('flag', 'f-l-a-g', 'n', 1, '🚩'), W('flip', 'f-l-i-p', 'v', 2), W('flop', 'f-l-o-p', 'v', 3), W('frog', 'f-r-o-g', 'n', 1, '🐸'),
  W('from', 'f-r-o-m', 'o', 1), W('glad', 'g-l-a-d', 'adj', 2, '😊'), W('grab', 'g-r-a-b', 'v', 2), W('grin', 'g-r-i-n', 'v', 2, '😁'),
  W('drip', 'd-r-i-p', 'v', 2), W('drop', 'd-r-o-p', 'v', 2), W('drum', 'd-r-u-m', 'n', 1, '🥁'), W('trap', 't-r-a-p', 'n', 3),
  W('trip', 't-r-i-p', 'n', 2), W('twig', 't-w-i-g', 'n', 3), W('twin', 't-w-i-n', 'n', 2, '👯'), W('swim', 's-w-i-m', 'v', 1, '🏊'),
  W('plan', 'p-l-a-n', 'n', 2), W('plum', 'p-l-u-m', 'n', 2), W('plug', 'p-l-u-g', 'n', 2, '🔌'), W('clap', 'c-l-a-p', 'v', 1, '👏'),
  W('clip', 'c-l-i-p', 'n', 3, '📎'), W('club', 'c-l-u-b', 'n', 3), W('crab', 'c-r-a-b', 'n', 1, '🦀'), W('crop', 'c-r-o-p', 'n', 3),
  W('brush', 'b-r-u-sh', 'n', 1, '🪥'), W('crash', 'c-r-a-sh', 'n', 2), W('flash', 'f-l-a-sh', 'n', 2), W('splash', 's-p-l-a-sh', 'v', 2, '💦'),
  W('stamp', 's-t-a-m-p', 'n', 2), W('stand', 's-t-a-n-d', 'v', 1), W('trunk', 't-r-u-n-k', 'n', 2), W('twist', 't-w-i-s-t', 'v', 2),
  W('string', 's-t-r-i-ng', 'n', 2), W('sting', 's-t-i-ng', 'v', 3), W('swing', 's-w-i-ng', 'n', 1),
  W('Fred', 'f-r-e-d', 'nm', 2), W('Stan', 's-t-a-n', 'nm', 3),
  // ---- Set 8: ai ee igh oa oo
  W('rain', 'r-ai-n', 'n', 1, '🌧️'), W('tail', 't-ai-l', 'n', 1), W('wait', 'w-ai-t', 'v', 1, '⏳'), W('pain', 'p-ai-n', 'n', 2),
  W('nail', 'n-ai-l', 'n', 2, '💅'), W('sail', 's-ai-l', 'v', 2), W('paid', 'p-ai-d', 'v', 3), W('mail', 'm-ai-l', 'n', 2, '📬'),
  W('snail', 's-n-ai-l', 'n', 1, '🐌'), W('train', 't-r-ai-n', 'n', 1, '🚂'), W('see', 's-ee', 'v', 1, '👀'), W('bee', 'b-ee', 'n', 1, '🐝'),
  W('feet', 'f-ee-t', 'n', 1, '🦶'), W('feel', 'f-ee-l', 'v', 2), W('need', 'n-ee-d', 'v', 1), W('seed', 's-ee-d', 'n', 2, '🌱'),
  W('weed', 'w-ee-d', 'n', 3), W('keep', 'k-ee-p', 'v', 1), W('deep', 'd-ee-p', 'adj', 2), W('meet', 'm-ee-t', 'v', 2),
  W('tree', 't-r-ee', 'n', 1, '🌳'), W('sleep', 's-l-ee-p', 'v', 1), W('sheep', 'sh-ee-p', 'n', 1, '🐑'), W('feed', 'f-ee-d', 'v', 2),
  W('week', 'w-ee-k', 'n', 2), W('green', 'g-r-ee-n', 'adj', 1, '🟢'), W('teeth', 't-ee-th', 'n', 1), W('queen', 'qu-ee-n', 'n', 1, '👸'),
  W('high', 'h-igh', 'adj', 1), W('sigh', 's-igh', 'v', 3), W('night', 'n-igh-t', 'n', 1, '🌃'), W('light', 'l-igh-t', 'n', 1, '💡'),
  W('fight', 'f-igh-t', 'v', 3), W('right', 'r-igh-t', 'o', 1), W('might', 'm-igh-t', 'o', 2), W('tight', 't-igh-t', 'adj', 2),
  W('bright', 'b-r-igh-t', 'adj', 2, '✨'), W('boat', 'b-oa-t', 'n', 1, '⛵'), W('coat', 'c-oa-t', 'n', 1, '🧥'), W('goat', 'g-oa-t', 'n', 1, '🐐'),
  W('road', 'r-oa-d', 'n', 1, '🛣️'), W('load', 'l-oa-d', 'n', 3), W('toad', 't-oa-d', 'n', 2), W('soap', 's-oa-p', 'n', 1, '🧼'),
  W('foam', 'f-oa-m', 'n', 3), W('oak', 'oa-k', 'n', 3), W('loaf', 'l-oa-f', 'n', 2, '🍞'), W('moon', 'm-oo-n', 'n', 1, '🌙'),
  W('food', 'f-oo-d', 'n', 1), W('root', 'r-oo-t', 'n', 2), W('boot', 'b-oo-t', 'n', 1, '🥾'), W('hoop', 'h-oo-p', 'n', 2),
  W('zoo', 'z-oo', 'n', 1), W('too', 't-oo', 'o', 1), W('soon', 's-oo-n', 'o', 1), W('pool', 'p-oo-l', 'n', 1),
  W('cool', 'c-oo-l', 'adj', 1, '😎'), W('roof', 'r-oo-f', 'n', 2), W('tooth', 't-oo-th', 'n', 1, '🦷'), W('boo', 'b-oo', 'o', 1, '👻'),
  W('moo', 'm-oo', 'v', 1), W('spoon', 's-p-oo-n', 'n', 1, '🥄'), W('broom', 'b-r-oo-m', 'n', 2),
  // ---- Set 9: ar or ur ow oi
  W('car', 'c-ar', 'n', 1, '🚗'), W('far', 'f-ar', 'o', 1), W('jar', 'j-ar', 'n', 2), W('bar', 'b-ar', 'n', 3),
  W('star', 's-t-ar', 'n', 1, '⭐'), W('card', 'c-ar-d', 'n', 2, '🃏'), W('park', 'p-ar-k', 'n', 1), W('dark', 'd-ar-k', 'adj', 1, '🌑'),
  W('farm', 'f-ar-m', 'n', 1, '🚜'), W('barn', 'b-ar-n', 'n', 2), W('arm', 'ar-m', 'n', 1, '💪'), W('art', 'ar-t', 'n', 2, '🎨'),
  W('hard', 'h-ar-d', 'adj', 1), W('shark', 'sh-ar-k', 'n', 1, '🦈'), W('for', 'f-or', 'o', 1), W('fork', 'f-or-k', 'n', 1, '🍴'),
  W('corn', 'c-or-n', 'n', 1, '🌽'), W('born', 'b-or-n', 'v', 2), W('horn', 'h-or-n', 'n', 2, '📯'), W('torn', 't-or-n', 'adj', 3),
  W('sort', 's-or-t', 'v', 2), W('short', 'sh-or-t', 'adj', 1), W('cord', 'c-or-d', 'n', 3), W('storm', 's-t-or-m', 'n', 2, '⛈️'),
  W('sport', 's-p-or-t', 'n', 2), W('fur', 'f-ur', 'n', 2), W('burn', 'b-ur-n', 'v', 2), W('turn', 't-ur-n', 'v', 1),
  W('hurt', 'h-ur-t', 'v', 1, '🤕'), W('curl', 'c-ur-l', 'v', 2), W('surf', 's-ur-f', 'v', 2, '🏄'), W('burp', 'b-ur-p', 'v', 2),
  W('church', 'ch-ur-ch', 'n', 2, '⛪'), W('cow', 'c-ow', 'n', 1, '🐮'), W('how', 'h-ow', 'o', 1), W('now', 'n-ow', 'o', 1),
  W('down', 'd-ow-n', 'o', 1), W('town', 't-ow-n', 'n', 2, '🏘️'), W('owl', 'ow-l', 'n', 1, '🦉'), W('howl', 'h-ow-l', 'v', 2, '🐺'),
  W('brown', 'b-r-ow-n', 'adj', 1, '🟤'), W('clown', 'c-l-ow-n', 'n', 1, '🤡'), W('crowd', 'c-r-ow-d', 'n', 3), W('oil', 'oi-l', 'n', 2),
  W('coin', 'c-oi-n', 'n', 1, '🪙'), W('join', 'j-oi-n', 'v', 2), W('boil', 'b-oi-l', 'v', 2), W('soil', 's-oi-l', 'n', 2),
  W('foil', 'f-oi-l', 'n', 3), W('coil', 'c-oi-l', 'n', 3), W('point', 'p-oi-n-t', 'v', 1, '👉'), W('toilet', 't-oi-l-e-t', 'n', 1, '🚽'),
  // ---- Set 10: ear air er
  W('ear', 'ear', 'n', 1, '👂'), W('hear', 'h-ear', 'v', 1), W('dear', 'd-ear', 'o', 2), W('near', 'n-ear', 'o', 1),
  W('fear', 'f-ear', 'n', 2, '😨'), W('year', 'y-ear', 'n', 1), W('tear', 't-ear', 'n', 2), W('beard', 'b-ear-d', 'n', 2, '🧔'),
  W('hair', 'h-air', 'n', 1, '💇'), W('fair', 'f-air', 'adj', 2, '🎡'), W('pair', 'p-air', 'n', 2, '👟'), W('air', 'air', 'n', 1),
  W('chair', 'ch-air', 'n', 1, '🪑'), W('stairs', 's-t-air-s', 'n', 1), W('hammer', 'h-a-mm-er', 'n', 1, '🔨'),
  W('letter', 'l-e-tt-er', 'n', 1, '✉️'), W('better', 'b-e-tt-er', 'adj', 1), W('dinner', 'd-i-nn-er', 'n', 1), W('summer', 's-u-mm-er', 'n', 1),
  W('boxer', 'b-o-x-er', 'n', 3, '🥊'), W('ladder', 'l-a-dd-er', 'n', 2, '🪜'), W('sister', 's-i-s-t-er', 'n', 1, '👧'), W('winter', 'w-i-n-t-er', 'n', 1, '❄️'),
];

// Doubled consonants inside longer words (mm, tt, nn, dd, bb) are aliases of
// their single letter; expand them so eligibility checks work.
const DOUBLE_ALIAS: Record<string, string> = { mm: 'm', tt: 't', nn: 'n', dd: 'd', bb: 'b' };
for (const w of WORDS) {
  w.g = w.g.map((x) => DOUBLE_ALIAS[x] ?? x);
}

/** De-duplicated by spelling (first definition wins). */
export const WORD_BY_SPELLING: Record<string, Word> = {};
for (const w of WORDS) {
  const key = w.w.toLowerCase();
  if (!WORD_BY_SPELLING[key]) WORD_BY_SPELLING[key] = w;
}
export const UNIQUE_WORDS: Word[] = Object.values(WORD_BY_SPELLING);
