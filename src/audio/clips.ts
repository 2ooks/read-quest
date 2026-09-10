// Stable clip ids shared by the audio generator and the runtime.

export function clipIdForSound(gpcId: string): string {
  return `s_${gpcId}`;
}

export function clipIdForWord(spelling: string): string {
  return `w_${spelling.toLowerCase().replace(/[^a-z]/g, '')}`;
}

/** Slow, connected pronunciation used to model blending ("mmmuuud"). */
export function clipIdForBlend(spelling: string): string {
  return `b_${spelling.toLowerCase().replace(/[^a-z]/g, '')}`;
}

export function clipIdForPhrase(phraseId: string): string {
  return `p_${phraseId}`;
}
