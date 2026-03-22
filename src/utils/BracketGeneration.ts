import type { TransformedGroups } from "../components/competitionSimulator/GROUPKO/GroupKOSimulator";
import type { MatchInformation } from "../components/competitionSimulator/SimulatorTab";
import { calculateNthPlaceTeams, sortTeams } from './GroupSort';

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

export function generateKnockout24(standings: TransformedGroups, getThirdPlacings: (key: string) => string | undefined): MatchInformation[] {
  
  const sortedStandings = Object.fromEntries(Object.entries(standings).map(([_, teams]) => [_, sortTeams(teams)]));
  console.log(standings, sortedStandings);

  const NthPlaceTeams = calculateNthPlaceTeams(standings, 16);
  const NthPlaceThrough = NthPlaceTeams.slice(0, 4);

  //Create mapping from team name to group name
  const teamToGroup: { [team: string]: string } = {};
  for (const [groupName, teams] of Object.entries(sortedStandings)) {
    for (const team of teams) {
      teamToGroup[team.countryName] = groupName;
    }
  }

  // Create dict with key group name and value team from NthPlaceThrough
  const groupToTeam: { [group: string]: string } = {};
  for (const team of NthPlaceThrough) {
    groupToTeam[teamToGroup[team.countryName]] = team.countryName;
  }

  const thirdPlaceList = Object.keys(groupToTeam);
  thirdPlaceList.sort();
  const thirdPlaceKeys = getThirdPlacings(thirdPlaceList.join(''));
  console.log(thirdPlaceKeys);


  return [
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['A'][1].countryName, awayTeam: sortedStandings['C'][1].countryName, result: null }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['D'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(3)][2].countryName, result: null }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['B'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(1)][2].countryName, result: null }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['F'][0].countryName, awayTeam: sortedStandings['E'][1].countryName, result: null }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['C'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(2)][2].countryName, result: null }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['E'][0].countryName, awayTeam: sortedStandings['D'][1].countryName, result: null }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['A'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(0)][2].countryName, result: null }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['B'][1].countryName, awayTeam: sortedStandings['F'][1].countryName, result: null }}
  ];
}