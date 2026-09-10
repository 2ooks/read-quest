// Wardrobe rewards — one unlocks per completed session.

export interface WardrobeItem {
  id: string;
  name: string;
  slot: 'head' | 'face' | 'neck' | 'hand' | 'feet' | 'back' | 'body';
  emoji: string;
}

export const WARDROBE: WardrobeItem[] = [
  { id: 'party_hat', name: 'Party hat', slot: 'head', emoji: '🎉' },
  { id: 'bow', name: 'Bow', slot: 'head', emoji: '🎀' },
  { id: 'glasses', name: 'Glasses', slot: 'face', emoji: '👓' },
  { id: 'scarf', name: 'Scarf', slot: 'neck', emoji: '🧣' },
  { id: 'balloon', name: 'Balloon', slot: 'hand', emoji: '🎈' },
  { id: 'crown', name: 'Crown', slot: 'head', emoji: '👑' },
  { id: 'boots', name: 'Boots', slot: 'feet', emoji: '👢' },
  { id: 'star_badge', name: 'Star badge', slot: 'body', emoji: '⭐' },
  { id: 'sunglasses', name: 'Sunglasses', slot: 'face', emoji: '🕶️' },
  { id: 'wand', name: 'Magic wand', slot: 'hand', emoji: '🪄' },
  { id: 'wings', name: 'Wings', slot: 'back', emoji: '🦋' },
  { id: 'top_hat', name: 'Top hat', slot: 'head', emoji: '🎩' },
  { id: 'flower', name: 'Flower', slot: 'head', emoji: '🌸' },
  { id: 'cape', name: 'Cape', slot: 'back', emoji: '🦸' },
  { id: 'pirate_hat', name: 'Pirate hat', slot: 'head', emoji: '🏴‍☠️' },
  { id: 'bowtie', name: 'Bow tie', slot: 'neck', emoji: '🎗️' },
  { id: 'headphones', name: 'Headphones', slot: 'head', emoji: '🎧' },
  { id: 'flag', name: 'Flag', slot: 'hand', emoji: '🚩' },
];

export const WARDROBE_BY_ID: Record<string, WardrobeItem> = Object.fromEntries(WARDROBE.map((w) => [w.id, w]));

/** Sticker rewards continue after every wardrobe item is unlocked. */
export const STICKERS = ['🌈', '🦄', '🐬', '🍓', '🌟', '🐢', '🍦', '🦕', '🎠', '🐧', '🌻', '🚀', '🦁', '🍉', '🐝', '🎨', '🐙', '🍩', '🦊', '🎪', '🐨', '🌵', '🍒', '🦜'];
