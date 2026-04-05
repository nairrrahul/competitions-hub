import type { Match } from "./SchedulerUtils";

export function normSDist(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);

  let prob =
    d *
    t *
    (0.3193815 +
      t *
        (-0.3565638 +
          t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  if (z > 0) {
    prob = 1 - prob;
  }

  return prob;
}

export function pickN(start: number, stop: number, n: number): number[] {
  if (n > stop - start + 1) {
    throw new Error("Cannot pick more unique numbers than the size of the range");
  }

  // Create an array with numbers from start to stop
  const arr = Array.from({ length: stop - start + 1 }, (_, i) => start + i);

  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // Take first n numbers
  return arr.slice(0, n);
}

export function renderScoreline(match: Match): string {
  const res = match.result;
  if (!res) {
    return 'N/A'
  } else {
    const maxGoalMin = Math.max(...[...res.team1GoalInfo, ...res.team2GoalInfo].map((goalInfo) => goalInfo.minute));
    const pens = res.penalties;
    if(pens != null) {
      const team1PenCount = pens.team1Results.filter(pen => pen === 'O').length;
      const team2PenCount = pens.team2Results.filter(pen => pen === 'O').length;
      return `${res.team1Goals} - ${res.team2Goals} (${team1PenCount} - ${team2PenCount} PSO)`
    }
    if(maxGoalMin > 90) {
      return `${res.team1Goals} - ${res.team2Goals} a.e.t.`
    }
    return `${res.team1Goals} - ${res.team2Goals}`;
  }
};

export function subProbability(minute: number): number {
  return Math.pow(26.16518 + (24434.3127/Math.exp(0.0751492*minute)),-0.234021);
}