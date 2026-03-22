import type { TransformedGroups } from '../components/competitionSimulator/GROUPKO/GroupKOSimulator';
import type { MatchInformation } from '../components/competitionSimulator/SimulatorTab';
import type { Squad, Player } from '../types/rosterManager';

export interface GoalInfo {
  goalScorer: Player;
  assist: Player | null;
  minute: number;
}

export interface Penalties {
  team1Name: string;
  team2Name: string;
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

export function simulateMatch(team1Squad: Squad, team2Squad: Squad, roundType: RoundType): MatchResult {
  const res = Math.random();
  console.log(roundType);
  if(res > 0.5) {
    return {
      team1Goals: 1,
      team2Goals: 2,
      team1GoalInfo: [{ goalScorer: team1Squad.starters.forwards[1].player, assist: team1Squad.starters.midfielders[0].player, minute: 74 }],
      team2GoalInfo: [{goalScorer: team2Squad.starters.forwards[0].player, assist: team2Squad.starters.midfielders[1].player, minute: 45}, {goalScorer: team2Squad.starters.forwards[1].player, assist: team2Squad.starters.defenders[0].player, minute: 88}],
      penalties: null,
      cleanSheetNames: []
    };
  } else {
    return {
      team1Goals: 1,
      team2Goals: 0,
      team1GoalInfo: [{ goalScorer: team1Squad.starters.forwards[0].player, assist: team1Squad.starters.midfielders[1].player, minute: 33 }],
      team2GoalInfo: [],
      penalties: null,
      cleanSheetNames: [team1Squad.starters.gk.player]
    };
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