import type { TransformedGroups } from "../components/competitionSimulator/GROUPKO/GroupKOSimulator";
import type { GroupTeamStats } from "../components/competitionSimulator/SimulatorTab";

export const calculateStats = (team: GroupTeamStats) => {
  const gamesPlayed = team.wins + team.draws + team.losses;
  const points = team.wins * 3 + team.draws;
  const goalDifference = team.goalsFor - team.goalsAgainst;
  
  return {
    gamesPlayed,
    points,
    goalDifference
  };
};

export const sortTeams = (teams: GroupTeamStats[]) => {
  return [...teams].sort((a, b) => {
    const statsA = calculateStats(a);
    const statsB = calculateStats(b);
    
    // Sort by points
    if (statsB.points !== statsA.points) {
      return statsB.points - statsA.points;
    }
    
    // Sort by goal difference
    if (statsB.goalDifference !== statsA.goalDifference) {
      return statsB.goalDifference - statsA.goalDifference;
    }
    
    // Sort by goals for
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    
    // Sort by alphabetical order
    return a.countryName.localeCompare(b.countryName);
  });
};

export const calculateNthPlaceTeams = (groups: TransformedGroups, numThrough: number) => {
  const nthPlaceTeams: GroupTeamStats[] = [];
  const nthPlace = getBestNthPlaceCount(Object.keys(groups).length, numThrough); // This is N (e.g., 3rd place)
  
  Object.entries(groups).forEach(([, teams]) => {
    const sortedTeams = sortTeams(teams);
    if (sortedTeams[nthPlace - 1]) { // nthPlace - 1 for 0-based index
      nthPlaceTeams.push(sortedTeams[nthPlace - 1]);
    }
  });
  
  // Sort by typical criteria: points, goal difference, goals for, alphabetical
  return nthPlaceTeams.sort((a, b) => {
    const aStats = calculateStats(a);
    const bStats = calculateStats(b);
    
    if (bStats.points !== aStats.points) return bStats.points - aStats.points;
    if (bStats.goalDifference !== aStats.goalDifference) return bStats.goalDifference - aStats.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.countryName.localeCompare(b.countryName);
  });
};

export const getBestNthPlaceCount = (totalGroups: number, numThrough: number) => {  
  return Math.ceil(numThrough / totalGroups);
};

export const getNthPlaceSuffix = (n: number) => {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
};