export function calculateSimilarity(str1: string, str2: string): number {
  const [longer, shorter] = str1.length > str2.length ? [str1, str2] : [str2, str1];
  const longerLength = longer.length;

  if (longerLength === 0) return 1.0;

  const distance = computeEditDistance(longer.toLowerCase(), shorter.toLowerCase());
  return (longerLength - distance) / longerLength;
}

function computeEditDistance(s1: string, s2: string): number {
  const costs: number[] = Array(s2.length + 1).fill(0);

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;

    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        const currentValue = costs[j - 1];
        costs[j - 1] = lastValue;

        lastValue = s1[i - 1] === s2[j - 1]
          ? currentValue
          : Math.min(Math.min(currentValue, lastValue), costs[j]) + 1;
      }
    }

    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}
