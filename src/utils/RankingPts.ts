import { useGlobalStore } from "../state/GlobalState";
import type { Squad } from "../types/rosterManager";
import { parseKnockoutWinner, type MatchResult, type RoundType } from "./MatchEngine";

export function caluclateTeamPositionRatingSum(squad: Squad): [number, number, number] {
  const defSum = squad.starters.defenders.map(p => p.player ? p.player.overall : 0).reduce((a, b) => a + b, 0);
  const midSum = squad.starters.midfielders.map(p => p.player ? p.player.overall : 0).reduce((a, b) => a + b, 0);
  const atkSum = squad.starters.forwards.map(p => p.player ? p.player.overall : 0).reduce((a, b) => a + b, 0);
  return [defSum, midSum, atkSum];
}

export function calculateTeamRating(squad: Squad): number {
  const [defenderRatings, midRatings, atkRatings] = caluclateTeamPositionRatingSum(squad);
  const defCount = squad.starters.defenders.length;
  const midCount = squad.starters.midfielders.length;
  const atkCount = squad.starters.forwards.length;
  const gkRating = squad.starters.gk.player.overall;

  const overall = defenderRatings / defCount * 0.3 + midRatings / midCount * 0.3 + atkRatings / atkCount * 0.3 + gkRating * 0.1;
  if (gkRating > 90 || (gkRating > 1.2 * overall && gkRating < 1.5 * overall)) {
    return overall + 1;
  } else if (gkRating > 1.5 * overall) {
    return overall + 2;
  } else {
    return overall;
  }
}

export function computeExpectedResult(team1Points: number, team2Points: number): number {
  return 1/(1 + Math.pow(10, -(team1Points - team2Points)/600));
}

export function computeRankingWeight(team1: string, team2: string, res: MatchResult, roundType: RoundType): [number, number] {
  if(roundType == 'GROUP') {
    if(res.team1Goals > res.team2Goals) {
      return [1, 0];
    } else if(res.team2Goals > res.team1Goals) {
      return [0, 1];
    } else {
      return [0.5, 0.5];
    }
  } else {
    if(res.team1Goals > res.team2Goals) {
      return [1, 0];
    } else if(res.team2Goals > res.team1Goals) {
      return [0, 1];
    } else {
      const winner = parseKnockoutWinner(team1, team2, res, true);
      if(winner === team1) {
        return [0.75, 0.5];
      } else {
        return [0.5, 0.75];
      }
    }
  }
}

export function getRankingPointsFromMatch(res: MatchResult, roundType: RoundType, team1Name: string, team2Name: string, matchdayNumber: number, competitionType: string, competitionName: string): {[nation: string]: number} {
  
  const getNationInfo = useGlobalStore.getState().getNationInfo;
  const nationOneInfo = getNationInfo(team1Name);
  const nationTwoInfo = getNationInfo(team2Name);

  const team1Expected = computeExpectedResult(nationOneInfo.rankingPts, nationTwoInfo.rankingPts);
  const team2Expected = computeExpectedResult(nationTwoInfo.rankingPts, nationOneInfo.rankingPts);

  const matchPoints = computeRankingWeight(team1Name, team2Name, res, roundType);
  const coeff = getRankingCoeff(matchdayNumber, roundType, competitionType, competitionName);

  return {
    [team1Name]: coeff * (matchPoints[0] - team1Expected),
    [team2Name]: coeff * (matchPoints[1] - team2Expected)
  };

}

export function getRankingCoeff(matchdayNumber: number, roundType: RoundType, competitionType: string, competitionName: string): number {
  if(competitionType != 'GROUPKO') {
    return 15;
  } else {
    const curCompInfo = useGlobalStore.getState().roundInfoPresets[competitionName];
    if(roundType == 'GROUP') {
      return curCompInfo.rounds[0].rankingPts;
    } else {
      const numGSMatches = curCompInfo.rounds[0].numMatchdays;
      const roundIdx = matchdayNumber - numGSMatches;
      return roundIdx > curCompInfo.rounds.length ? 40 : curCompInfo.rounds[roundIdx].rankingPts;
    }
  }
}