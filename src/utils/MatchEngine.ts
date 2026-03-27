import type { TransformedGroups } from '../components/competitionSimulator/GROUPKO/GroupKOSimulator';
import type { MatchInformation } from '../components/competitionSimulator/SimulatorTab';
import { useGlobalStore } from '../state/GlobalState';
import type { Squad, Player } from '../types/rosterManager';
import type { Match } from './SchedulerUtils';
import scoreProbs from '../config/score_probs.json';

const scoreProbabilities = scoreProbs as { [scoreline: string]: number };
const SCALAR_VALUE = 4;

export interface GoalInfo {
  goalScorer: Player;
  assist: Player | null;
  minute: number;
}

export interface Penalties {
  team1Results: ('X' | 'O')[];
  team2Results: ('X' | 'O')[];
}

export interface GSTeamPoints {
  team1Points: number;
  team2Points: number;
}

export interface MatchResult {
  team1Goals: number;
  team2Goals: number;
  team1GoalInfo: GoalInfo[];
  team2GoalInfo: GoalInfo[];
  penalties: Penalties | null;
  cleanSheetNames: Player[];
  rankingDelta: { [nation: string]: number } | null;
  // substitutions: {
  //   team1: Array<{ playerOut: Player; playerIn: Player; minute: number }>;
  //   team2: Array<{ playerOut: Player; playerIn: Player; minute: number }>;
  // };
}

export interface MatchRoundInfo {
  matches: MatchInformation[];
  squads: { [nation: string]: Squad };
  standings: TransformedGroups;
}

export interface KOMatchRoundResult {
  oldMatches: MatchInformation[];
  newRound: MatchInformation[];
  loserInfo: MatchInformation[];
}

export type RoundType = 'GROUP' | 'KO' | 'P3';

export function penaltyResult(val: number): ('X' | 'O') {
    if(val <= 10) {
        return 'O';
    } else {
        return 'X';
    }
}

export function caluclateTeamPositionRatingSum(squad: Squad): [number, number, number] {
  const defSum = squad.starters.defenders.map(p => p.player ? p.player.overall : 0).reduce((a, b) => a + b, 0);
  const midSum = squad.starters.midfielders.map(p => p.player ? p.player.overall : 0).reduce((a, b) => a + b, 0);
  const atkSum = squad.starters.forwards.map(p => p.player ? p.player.overall : 0).reduce((a, b) => a + b, 0);
  return [defSum, midSum, atkSum];
}

export function calculateTeamRating(squad: Squad): number {
  const [defenderRatings, midRatings, atkRatings] = caluclateTeamPositionRatingSum(squad);
  const gkRating = squad.starters.gk.player.overall;

  const overall = defenderRatings * 0.3 + midRatings * 0.3 + atkRatings * 0.3 + gkRating * 0.1;
  if (gkRating > 90 || (gkRating > 1.2 * overall && gkRating < 1.5 * overall)) {
    return overall + 1;
  } else if (gkRating > 1.5 * overall) {
    return overall + 2;
  } else {
    return overall;
  }
}

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

export function getRankingPointsFromMatch(res: MatchResult, roundType: RoundType, team1Name: string, team2Name: string): {[nation: string]: number} {
  const getNationInfo = useGlobalStore.getState().getNationInfo;
  const nationOneInfo = getNationInfo(team1Name);
  const nationTwoInfo = getNationInfo(team2Name);

  const team1Expected = computeExpectedResult(nationOneInfo.rankingPts, nationTwoInfo.rankingPts);
  const team2Expected = computeExpectedResult(nationTwoInfo.rankingPts, nationOneInfo.rankingPts);

  const matchPoints = computeRankingWeight(team1Name, team2Name, res, roundType);

  if(roundType == 'GROUP') {
    return {
      [team1Name]: 15 * (matchPoints[0] - team1Expected),
      [team2Name]: 15 * (matchPoints[1] - team2Expected)
    }
  } else {
    return {
      [team1Name]: 40 * (matchPoints[0] - team1Expected),
      [team2Name]: 40 * (matchPoints[1] - team2Expected)
    }
  }
}

export function pickRandomScoreline(scoreChances: { [scoreline: string]: number }): string {
  const rand = Math.random();
  
  let entries = Object.entries(scoreChances);
  entries.sort((a, b) => a[1] - b[1]);

  for(const entry of entries) {
    if(rand <= entry[1]) {
      return entry[0];
    }
  }

  return entries[entries.length - 1][0];
}

function pickN(start: number, stop: number, n: number): number[] {
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

export function generateStarterScoringProbability(squad: Squad): Map<Player, number> {
  const [defenderRatings, midRatings, atkRatings] = caluclateTeamPositionRatingSum(squad);
  const initialProbs = new Map<Player, number>([
    [squad.starters.defenders[0].player, squad.starters.defenders[0].player.overall / defenderRatings * 0.17],
    [squad.starters.defenders[1].player, squad.starters.defenders[1].player.overall / defenderRatings * 0.1],
    [squad.starters.defenders[2].player, squad.starters.defenders[2].player.overall / defenderRatings * 0.1],
    [squad.starters.defenders[3].player, squad.starters.defenders[3].player.overall / defenderRatings * 0.17],
    [squad.starters.midfielders[0].player, squad.starters.midfielders[0].player.overall / midRatings * 0.3],
    [squad.starters.midfielders[1].player, squad.starters.midfielders[1].player.overall / midRatings * 0.36],
    [squad.starters.midfielders[2].player, squad.starters.midfielders[2].player.overall / midRatings * 0.36],
    [squad.starters.forwards[0].player, squad.starters.forwards[0].player.overall / atkRatings * 0.51],
    [squad.starters.forwards[1].player, squad.starters.forwards[1].player.overall / atkRatings * 0.51],
    [squad.starters.forwards[2].player, squad.starters.forwards[2].player.overall / atkRatings * 0.57]
  ]);
  const total = Array.from(initialProbs.values()).reduce((acc, val) => acc + val, 0);
  return new Map(
    [...initialProbs.entries()].map(([k, v]) => [k, v / total])
  );
}

export function generateAssister(squad: Squad, scoringPlayer: Player): Player {
  const [defenderRatings, midRatings, atkRatings] = caluclateTeamPositionRatingSum(squad);
  const initialProbs = new Map<Player, number>([
    [squad.starters.defenders[0].player, squad.starters.defenders[0].player.overall / defenderRatings * 0.25],
    [squad.starters.defenders[1].player, squad.starters.defenders[1].player.overall / defenderRatings * 0.15],
    [squad.starters.defenders[2].player, squad.starters.defenders[2].player.overall / defenderRatings * 0.15],
    [squad.starters.defenders[3].player, squad.starters.defenders[3].player.overall / defenderRatings * 0.25],
    [squad.starters.midfielders[0].player, squad.starters.midfielders[0].player.overall / midRatings * 0.4],
    [squad.starters.midfielders[1].player, squad.starters.midfielders[1].player.overall / midRatings * 0.4],
    [squad.starters.midfielders[2].player, squad.starters.midfielders[2].player.overall / midRatings * 0.45],
    [squad.starters.forwards[0].player, squad.starters.forwards[0].player.overall / atkRatings * 0.45],
    [squad.starters.forwards[1].player, squad.starters.forwards[1].player.overall / atkRatings * 0.45],
    [squad.starters.forwards[2].player, squad.starters.forwards[2].player.overall / atkRatings * 0.25]
  ]);
  const resMap = new Map<Player, number>();
  for(const [player,prob] of initialProbs.entries()) {
    if(player.playerid !== scoringPlayer.playerid) {
      resMap.set(player, prob);
    }
  }
  const total = Array.from(initialProbs.values()).reduce((acc, val) => acc + val, 0);
  const normAssistProbs = [... new Map(
    [...resMap.entries()].map(([k, v]) => [k, v / total])
  ).entries()];
  
  const randAS = Math.random();
  normAssistProbs.sort();
  
  let cumulative = 0;
  for(const entry of normAssistProbs) {
    cumulative += entry[1];
    if(randAS <= cumulative) {
      return entry[0];
    }
  }
  return normAssistProbs[normAssistProbs.length-1][0];

}

export function generateSubstituteScoringProbability(squad: Squad): Map<Player, number> {
  const [defenderRatings, midRatings, atkRatings] = caluclateTeamPositionRatingSum(squad);
  const defList = squad.substitutes.defenders.filter(def => def != null)
    .map((defender) => [defender.player, defender.player.overall / defenderRatings * 0.31]);
  const midList = squad.substitutes.midfielders.filter(mid => mid != null)
    .map((mid) => [mid.player, mid.player.overall / midRatings * 0.33]);
  const atkList = squad.substitutes.forwards.filter(atk => atk != null)
    .map((fwd) => [fwd.player, fwd.player.overall / atkRatings * 0.36]);
  const newList: [Player, number][] = [...defList, ...midList, ...atkList] as [Player, number][];
  const initialProbs = new Map<Player, number>(newList);
  const total = Array.from(initialProbs.values()).reduce((acc, val) => acc + val, 0);
  return new Map(
    [...initialProbs.entries()].map(([k, v]) => [k, v / total])
  );
}


export function pickGoalScorerFromMinute(starterScoringProb: Map<Player, number>, subScoringProb: Map<Player, number>, minute: number) : Player {
  const subProb = subProbability(minute);
  const isSub = Math.random();
  const randGS = Math.random();
  let cumulative = 0;

  if(isSub >= subProb) {
    let entries = [...starterScoringProb.entries()];
    entries.sort();

    for(const entry of entries) {
      cumulative += entry[1];
      if(randGS <= cumulative) {
        return entry[0];
      }
    }
    return entries[entries.length-1][0];
  } else {
    let entries = [...subScoringProb.entries()];
    entries.sort();

    for(const entry of entries) {
      cumulative += entry[1];
      if(randGS <= cumulative) {
        return entry[0];
      }
    }
    return entries[entries.length-1][0];
  }
}

export function subProbability(minute: number): number {
  return Math.pow(26.16518 + (24434.3127/Math.exp(0.0751492*minute)),-0.234021);
}

export function penaltyShootout(): Penalties {
  let homePenalties: ('X'|'O')[] = [];
  let homePensScored = 0;
  let awayPenalties: ('X'|'O')[] = []
  let awayPensScored = 0;

  for(let i = 0; i < 5; i++) {
    let homeShot = penaltyResult(Math.floor(Math.random() * 14));
    let awayShot = penaltyResult(Math.floor(Math.random() * 14));

    homePenalties.push(homeShot);
    if(homeShot == 'O') homePensScored += 1;

    if(homePensScored + (4-i) < awayPensScored || awayPensScored + (5-i) < homePensScored) {
        break;
    }

    awayPenalties.push(awayShot);
    if(awayShot == 'O') awayPensScored += 1;

    if(awayPensScored + (4-i) < homePensScored || homePensScored + (5-i) < awayPensScored) {
        break;
    }
  }

  //sudden death if so
  if(homePensScored === awayPensScored) {
    let eqCounter = true;
    while (eqCounter) {
        let homeShot = penaltyResult(Math.floor(Math.random() * 14));
        let awayShot = penaltyResult(Math.floor(Math.random() * 14));
    
        homePenalties.push(homeShot);
        if(homeShot == 'O') homePensScored += 1;

        awayPenalties.push(awayShot);
        if(awayShot == 'O') awayPensScored += 1;


        eqCounter = homePensScored === awayPensScored;
    }
  }

  return {
    team1Results: homePenalties,
    team2Results: awayPenalties
  };

}

export function simulateRegulationMatch(goalSum: number, team1GoalCount: number, team2GoalCount: number, team1Squad: Squad, team2Squad: Squad, 
  team1StartScoreInfo: Map<Player, number>, team1SubScoreInfo: Map<Player, number>, 
  team2StartScoreInfo: Map<Player, number>, team2SubScoreInfo: Map<Player, number>): MatchResult 
  {
  const goalTimes = pickN(1,90,goalSum);
  const team1Goals = goalTimes.slice(0, +team1GoalCount);
  const team2Goals = goalTimes.slice(team1GoalCount);

  const team1GoalInfo = team1Goals.map((minute) => {
    let scorer = pickGoalScorerFromMinute(team1StartScoreInfo, team1SubScoreInfo, minute);
    let assister = generateAssister(team1Squad, scorer);

    return {
      goalScorer: scorer,
      assist: assister,
      minute: minute
    }
  });

  const team2GoalInfo = team2Goals.map((minute) => {
    let scorer = pickGoalScorerFromMinute(team2StartScoreInfo, team2SubScoreInfo, minute);
    let assister = generateAssister(team2Squad, scorer);

    return {
      goalScorer: scorer,
      assist: assister,
      minute: minute
    }
  });

  const cleanSheetNames = [];
  if (team1GoalCount == 0) cleanSheetNames.push(team2Squad.starters.gk.player);
  if (team2GoalCount == 0) cleanSheetNames.push(team1Squad.starters.gk.player);

  return {
    team1Goals: team1GoalCount,
    team2Goals: team2GoalCount,
    team1GoalInfo: team1GoalInfo,
    team2GoalInfo: team2GoalInfo,
    penalties: null,
    cleanSheetNames: cleanSheetNames,
    rankingDelta: null
  };
}

export function simulateMatch(team1Squad: Squad, team2Squad: Squad, roundType: RoundType): MatchResult {
  console.log(team1Squad.starters);
  
  const team1InitRating = calculateTeamRating(team1Squad);
  const team2InitRating = calculateTeamRating(team2Squad);

  const team1Rating = ((roundType == 'KO' || roundType == 'P3') && team1InitRating > team2InitRating) ? team1InitRating + 2 : team1InitRating;
  const team2Rating = ((roundType == 'KO' || roundType == 'P3') && team2InitRating > team1InitRating) ? team2InitRating + 2 : team2InitRating;

  let ratingRatio = Math.pow(team1Rating / team2Rating, 2);
  const ratingFactor = ratingRatio < 1 ? 0.0276842*Math.pow(33.50952, ratingRatio) + 0.0723158 : 1;
  const ratingSkew = (1-ratingFactor) * SCALAR_VALUE;
  const skewedZ = Object.fromEntries(
    Object.entries(scoreProbabilities)
    .map(([scoreline, prob]) => ([scoreline, ratingSkew+Math.sign(prob)*Math.pow(Math.abs(prob),2)])));
  
  const scorelineChances = Object.fromEntries(
    Object.entries(skewedZ)
    .map(([scoreline, skew]) => ([scoreline, normSDist(skew) ])));

  const finalScoreline = pickRandomScoreline(scorelineChances);
  const team1GoalCount = +finalScoreline.split('-')[0];
  const team2GoalCount = +finalScoreline.split('-')[1];
  const goalSum = team1GoalCount + team2GoalCount;
  const lesserGoals = Math.min(team1GoalCount, team2GoalCount);

  const team1StartScoreInfo = generateStarterScoringProbability(team1Squad);
  const team1SubScoreInfo = generateSubstituteScoringProbability(team1Squad);

  const team2StartScoreInfo = generateStarterScoringProbability(team2Squad);
  const team2SubScoreInfo = generateSubstituteScoringProbability(team2Squad);
  
  
  if(roundType == 'GROUP') {
    return simulateRegulationMatch(goalSum, team1GoalCount, team2GoalCount, team1Squad, team2Squad, team1StartScoreInfo, team1SubScoreInfo, team2StartScoreInfo, team2SubScoreInfo);

  } else {
    const penalties = +finalScoreline.split('-')[0] === +finalScoreline.split('-')[1];
    if(penalties) {
      const result = simulateRegulationMatch(goalSum, team1GoalCount, team2GoalCount, team1Squad, team2Squad, team1StartScoreInfo, team1SubScoreInfo, team2StartScoreInfo, team2SubScoreInfo);
      return {
        ...result,
        penalties: penaltyShootout()
      };

    } else {
      const extraTime = Math.random() < 0.15;
      if (extraTime) {
        const constRegulationGoalTimes = pickN(1,90,2*lesserGoals);
        const extraTimeGoalTimes = pickN(91, 120,goalSum - 2*lesserGoals);

        const team1GoalInfo = constRegulationGoalTimes.slice(0,lesserGoals).map((minute) => {
          let scorer = pickGoalScorerFromMinute(team1StartScoreInfo, team1SubScoreInfo, minute);
          let assister = generateAssister(team1Squad, scorer);

          return {
            goalScorer: scorer,
            assist: assister,
            minute: minute
          }
        });

        const team2GoalInfo = constRegulationGoalTimes.slice(lesserGoals).map((minute) => {
          let scorer = pickGoalScorerFromMinute(team2StartScoreInfo, team2SubScoreInfo, minute);
          let assister = generateAssister(team2Squad, scorer);

          return {
            goalScorer: scorer,
            assist: assister,
            minute: minute
          }
        });

        const extraTimeGoalInfo = extraTimeGoalTimes.map((minute) => {
          let startScoreMap = team1GoalCount > team2GoalCount ? team1StartScoreInfo : team2StartScoreInfo;
          let subScoreMap = team1GoalCount > team2GoalCount ? team1SubScoreInfo : team2SubScoreInfo;
          let squad = team1GoalCount > team2GoalCount ? team1Squad : team2Squad;

          let scorer = pickGoalScorerFromMinute(startScoreMap, subScoreMap, minute);
          let assister = generateAssister(squad, scorer);

          return {
            goalScorer: scorer,
            assist: assister,
            minute: minute
          }
        });

        const cleanSheetNames = [];
        if (team1GoalCount == 0) cleanSheetNames.push(team2Squad.starters.gk.player);
        if (team2GoalCount == 0) cleanSheetNames.push(team1Squad.starters.gk.player);

        return {
          team1Goals: team1GoalCount,
          team2Goals: team2GoalCount,
          team1GoalInfo: team1GoalCount > team2GoalCount ? [...team1GoalInfo, ...extraTimeGoalInfo] : team1GoalInfo,
          team2GoalInfo: team2GoalCount > team1GoalCount ? [...team2GoalInfo, ...extraTimeGoalInfo] : team2GoalInfo,
          penalties: null,
          cleanSheetNames: cleanSheetNames,
          rankingDelta: null
        }

      } else {
        return simulateRegulationMatch(goalSum, team1GoalCount, team2GoalCount, team1Squad, team2Squad, team1StartScoreInfo, team1SubScoreInfo, team2StartScoreInfo, team2SubScoreInfo);
      }
    }
  }
}

export function parseKnockoutWinner(team1: string, team2: string, match: MatchResult, winnerProg: boolean) {
  if(match.team1Goals > match.team2Goals) {
    return winnerProg ? team1 : team2;
  }else if(match.team2Goals > match.team1Goals) {
    return winnerProg ? team2 : team1;
  } else {
    let team1PensMade = match.penalties!.team1Results.filter(pen => pen === 'O').length;
    let team2PensMade = match.penalties!.team2Results.filter(pen => pen === 'O').length;
    return (team1PensMade > team2PensMade === winnerProg) ? team1 : team2;
  }
}

export function simulateKnockoutRound(matches: MatchInformation[], squads: {[nation: string]: Squad}): KOMatchRoundResult {
  let winners = [];
  let losers = [];

  const newKOMatches: MatchInformation[] = matches.map(matchInfo => {
    const team1Squad = squads[matchInfo.match.homeTeam];
    const team2Squad = squads[matchInfo.match.awayTeam];
    const matchType = matchInfo.stage;

    const matchResult = simulateMatch(team1Squad, team2Squad, matchType);
    matchResult.rankingDelta = getRankingPointsFromMatch(matchResult, matchType, matchInfo.match.homeTeam, matchInfo.match.awayTeam);

    return {
      ...matchInfo,
      match: {
        ...matchInfo.match,
        result: matchResult
      }
    };
  });


  if(newKOMatches.length == 1) {
    return {
      oldMatches: newKOMatches,
      newRound: [],
      loserInfo: []
    }
  }

  for(let i = 0; i < newKOMatches.length; i+=2) {

    let match1Winner = parseKnockoutWinner(newKOMatches[i].match.homeTeam, newKOMatches[i].match.awayTeam, newKOMatches[i].match.result!, true);
    let match2Winner = parseKnockoutWinner(newKOMatches[i+1].match.homeTeam, newKOMatches[i+1].match.awayTeam, newKOMatches[i+1].match.result!, true);
    let match1Loser = parseKnockoutWinner(newKOMatches[i].match.homeTeam, newKOMatches[i].match.awayTeam, newKOMatches[i].match.result!, false);
    let match2Loser = parseKnockoutWinner(newKOMatches[i+1].match.homeTeam, newKOMatches[i+1].match.awayTeam, newKOMatches[i+1].match.result!, false);

    winners.push({
      stage: 'KO' as RoundType, 
      group: null, 
      match: { 
        homeTeam: match1Winner, 
        awayTeam: match2Winner, 
        result: null 
      }
    });

    losers.push({
      stage: 'KO' as RoundType, 
      group: null, 
      match: { 
        homeTeam: match1Loser, 
        awayTeam: match2Loser, 
        result: null 
      }
    });
  }

  return {
    oldMatches: newKOMatches,
    newRound: winners,
    loserInfo: losers
  };
}


export function simulateMatchesForRound(matches: MatchInformation[], squads: { [nation: string]: Squad }, standings: TransformedGroups): MatchRoundInfo{
  const newMatches: MatchInformation[] = matches.map(matchInfo => {
    const team1Squad = squads[matchInfo.match.homeTeam];
    const team2Squad = squads[matchInfo.match.awayTeam];
    const matchType = matchInfo.stage;

    const matchResult = simulateMatch(team1Squad, team2Squad, matchType);
    matchResult.rankingDelta = getRankingPointsFromMatch(matchResult, matchType, matchInfo.match.homeTeam, matchInfo.match.awayTeam);

    return {
      ...matchInfo,
      match: {
        ...matchInfo.match,
        result: matchResult
      }
    };
  });

  const newStandings: TransformedGroups = {};
  for (const [group, teams] of Object.entries(standings)) {
    newStandings[group] = teams.map(team => ({ ...team }));
  }

  for (const matchInfo of newMatches) {
    if (matchInfo.stage !== "GROUP") continue;

    const groupName = matchInfo.group!;
    const result = matchInfo.match.result!;

    const group = newStandings[groupName];

    const team1 = group.find(t => t.countryName === matchInfo.match.homeTeam)!;
    const team2 = group.find(t => t.countryName === matchInfo.match.awayTeam)!;

    team1.goalsFor += result.team1Goals;
    team1.goalsAgainst += result.team2Goals;
    if (result.team1Goals > result.team2Goals) team1.wins++;
    else if (result.team1Goals === result.team2Goals) team1.draws++;
    else team1.losses++;

    team2.goalsFor += result.team2Goals;
    team2.goalsAgainst += result.team1Goals;
    if (result.team2Goals > result.team1Goals) team2.wins++;
    else if (result.team2Goals === result.team1Goals) team2.draws++;
    else team2.losses++;
  }

  return {
    matches: newMatches,
    squads,
    standings: newStandings
  };

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