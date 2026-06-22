import type { TransformedGroups } from "../components/competitionSimulator/GROUPKO/GroupKOSimulator";
import type { MatchInformation } from "../components/competitionSimulator/SimulatorTab";
import { calculateNthPlaceTeams, sortTeams } from './GroupSort';

type MatchEntry = string | number;

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

export function roundInfoFromBracket(bracket: (string | null)[]) {
    const nullCount = bracket.filter(x => x === null).length;

    const res: Record<number, Record<number, MatchEntry[]>> = {};

    // no byes
    if (nullCount === 0) {
        res[1] = {};

        for (let i = 0; i < bracket.length; i += 2) {
            res[1][i / 2 + 1] = [
                bracket[i]!,
                bracket[i + 1]!
            ];
        }

        return res;
    }

    res[1] = {};
    res[2] = {};

    let round1MatchNum = 1;
    let round2MatchNum = 1;

    // process groups of four
    for (let i = 0; i < bracket.length; i += 4) {

        const pair1 = [bracket[i], bracket[i + 1]];
        const pair2 = [bracket[i + 2], bracket[i + 3]];

        const advancers: MatchEntry[] = [];

        for (const pair of [pair1, pair2]) {

            const teams = pair.filter(x => x !== null) as string[];

            if (teams.length === 2) {
                // create round 1 match
                res[1][round1MatchNum] = teams;

                // winner represented by match number
                advancers.push(round1MatchNum);

                round1MatchNum++;
            }
            else if (teams.length === 1) {
                // bye
                advancers.push(teams[0]);
            }
        }

        // If both pairings were byes (case 1 second group),
        // the two surviving teams play in round 2.
        if (advancers.length === 2) {
            res[2][round2MatchNum] = advancers;
            round2MatchNum++;
        }
    }

    // remove empty round1 if none existed
    if (Object.keys(res[1]).length === 0) {
        delete res[1];
    }

    return res;
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