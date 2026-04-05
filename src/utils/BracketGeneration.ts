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

export function generateKnockout48(standings: TransformedGroups, getThirdPlacings: (key: string) => string | undefined): MatchInformation[] {

  const sortedStandings = Object.fromEntries(Object.entries(standings).map(([_, teams]) => [_, sortTeams(teams)]));

  const NthPlaceTeams = calculateNthPlaceTeams(standings, 32);
  const NthPlaceThrough = NthPlaceTeams.slice(0, 8);

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

  return [
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['E'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(3)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['I'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(5)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['A'][1].countryName, awayTeam: sortedStandings['B'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['F'][0].countryName, awayTeam: sortedStandings['C'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['K'][1].countryName, awayTeam: sortedStandings['L'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['H'][0].countryName, awayTeam: sortedStandings['J'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['D'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(2)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['G'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(4)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['C'][0].countryName, awayTeam: sortedStandings['F'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['E'][1].countryName, awayTeam: sortedStandings['I'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['A'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(0)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['L'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(7)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['J'][0].countryName, awayTeam: sortedStandings['H'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['D'][1].countryName, awayTeam: sortedStandings['G'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['B'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(1)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['K'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(6)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
  ];
}

export function generateKnockout24(standings: TransformedGroups, getThirdPlacings: (key: string) => string | undefined): MatchInformation[] {
  
  const sortedStandings = Object.fromEntries(Object.entries(standings).map(([_, teams]) => [_, sortTeams(teams)]));

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
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['A'][1].countryName, awayTeam: sortedStandings['C'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['D'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(3)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['B'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(1)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['F'][0].countryName, awayTeam: sortedStandings['E'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['C'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(2)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['E'][0].countryName, awayTeam: sortedStandings['D'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['A'][0].countryName, awayTeam: sortedStandings[thirdPlaceKeys!.charAt(0)][2].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }},
    {stage: 'KO', group: null, match: { homeTeam: sortedStandings['B'][1].countryName, awayTeam: sortedStandings['F'][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }}
  ];
}

export function generateKnockoutPO2(standings: TransformedGroups): MatchInformation[] {
  let evenBracket: MatchInformation[] = [];
  let oddBracket: MatchInformation[] = [];
  const sortedStandings = Object.fromEntries(Object.entries(standings).map(([_, teams]) => [_, sortTeams(teams)]));
  const groupNamesSorted = Object.keys(sortedStandings)
  groupNamesSorted.sort();

  let oddsPos = 0;
  let evensPos = groupNamesSorted.length - 1;
  while(oddsPos < groupNamesSorted.length -1 && evensPos > 0) {
    oddBracket.push({stage: 'KO', group: null, match: { homeTeam: sortedStandings[groupNamesSorted[oddsPos]][0].countryName, awayTeam: sortedStandings[groupNamesSorted[oddsPos+1]][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }});
    evenBracket.unshift({stage: 'KO', group: null, match: { homeTeam: sortedStandings[groupNamesSorted[evensPos]][0].countryName, awayTeam: sortedStandings[groupNamesSorted[evensPos - 1]][1].countryName, result: null, matchRiggedOptions: {isRigged: false, homeGoals: -1, awayGoals: -1} }});
    oddsPos += 2;
    evensPos -= 2;
  }
  return oddBracket.concat(evenBracket);
}