function generateBalancedSeeds(P: number): number[] {
  if (P === 1) return [1];

  const half = P / 2;
  const prev = generateBalancedSeeds(half);

  const result: number[] = [];
  for (const seed of prev) {
    result.push(seed);
    result.push(P + 1 - seed);
  }
  return result;
}


export function generateBracketPositions(N: number) {
  const P = 1 << Math.ceil(Math.log2(N));

  const ordering = generateBalancedSeeds(P);

  const bracket = ordering.map((seed) => seed > N ? null : seed);

  return bracket;
}
