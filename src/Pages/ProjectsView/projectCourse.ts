/** Only explicit markers split cards; fenced examples remain literal Markdown. */
export function splitChunks(markdown: string): string[] {
  const chunks: string[] = [];
  let lines: string[] = [];
  let fence: { char: string; length: number } | undefined;

  const finishChunk = () => {
    const content = lines.join('\n').trim();
    if (content) chunks.push(content);
    lines = [];
  };

  for (const line of markdown.split(/\r?\n/)) {
    const match = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);

    if (match) {
      // A closing fence must use the same character and be at least as long.
      // This keeps nested fence examples from accidentally splitting a card.
      if (!fence) {
        fence = { char: match[1][0], length: match[1].length };
      } else if (
        match[1][0] === fence.char &&
        match[1].length >= fence.length &&
        !match[2].trim()
      ) {
        fence = undefined;
      }
      lines.push(line);
    } else if (!fence && /^\s*<!--\s*chunk\s*-->\s*$/.test(line)) {
      finishChunk();
    } else {
      lines.push(line);
    }
  }

  finishChunk();
  return chunks;
}

/**
 * Generate one page-edge pond and two attached ponds per side of each card.
 * Widths are pixels; vertical positions are percentages of the card height.
 * Injecting random lets tests exercise the placement bounds deterministically.
 */
export function makeWater(count: number, random = Math.random) {
  return Array.from({ length: count }, () => ({
    // Preserve the current tuning: this 45–125% range can extend below a card.
    oppositeTop: 45 + random() * 80,
    ponds: (['left', 'right'] as const).flatMap(side =>
      [0, 1].map(band => ({
        side,
        width: 100 + random() * 24,
        // Separate upper and lower bands prevent same-side ponds overlapping.
        top: 12 + band * 48 + random() * 28,
      })),
    ),
  }));
}
