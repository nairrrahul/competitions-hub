import type { MatchResult } from "./MatchEngine";

// Types for match scheduling
export interface Match {
  homeTeam: string;
  awayTeam: string;
  result: MatchResult | null;
  matchRiggedOptions: RiggedMatchProps;
}

export interface RiggedMatchProps {
  isRigged: boolean;
  homeGoals: number;
  awayGoals: number;
  originalBracketMatchNum?: number; // Store original bracket match number for resolution
  originalBracketRound?: number; // Store original bracket round number for resolution
}

export interface GroupMatchSchedule {
  [matchday: number]: Match[];
}

export interface CompetitionSchedule {
  [groupName: string]: GroupMatchSchedule;
}

export interface HomeAwaySchedule {
  [matchday: number]: Match[];
}

/**
 * Generates a round-robin schedule for a group of teams
 * @param teams Array of team names
 * @param homeAway Boolean indicating if home-and-away format should be used
 * @param offset Group-based offset parameter for shifting matchdays
 * @returns Object with matchdays as keys and arrays of matches as values
 */
export function leagueScheduler(teams: string[], homeAway: boolean, offset: number = 0): GroupMatchSchedule {

  let matches: GroupMatchSchedule = {};
  let modifiedTeams = [...teams];

  // Add dummy team if odd number of teams
  if (modifiedTeams.length % 2 === 1) {
    modifiedTeams.push("X");
  }

  let baseIterations = modifiedTeams.length - 1;
  
  // First, generate base matchdays (single round-robin)
  const baseMatchdays: Match[][] = [];
  for (let i = 0; i < baseIterations; i++) {
    const matchups: Match[] = [];
    for (let j = 0; j < Math.floor(modifiedTeams.length / 2); j++) {
      const team1 = modifiedTeams[j];
      const team2 = modifiedTeams[modifiedTeams.length - 1 - j];
      if (team1 !== "X" && team2 !== "X") {
        matchups.push({
          homeTeam: team1,
          awayTeam: team2,
          result: null,
          matchRiggedOptions: {
            isRigged: false,
            homeGoals: -1,
            awayGoals: -1
          }
        });
      }
    }
    baseMatchdays.push(matchups);
    const cycleOut = modifiedTeams.pop()!;
    modifiedTeams.splice(1, 0, cycleOut);
  }

  // Apply offset to shift matchdays
  const totalMatchdays = baseMatchdays.length;
  const shiftedMatchdays: Match[][] = [];
  for (let i = 0; i < totalMatchdays; i++) {
    const shiftedIndex = (i + offset) % totalMatchdays;
    shiftedMatchdays.push(baseMatchdays[shiftedIndex]);
  }

  // Flip home and away in the first match of every even-numbered matchday
  shiftedMatchdays.forEach((matchday, index) => {
    const matchdayNumber = index + 1; // 1-indexed matchday number
    if (matchdayNumber % 2 === 0 && matchday.length > 0) {
      // Flip home and away for the first match only
      const firstMatch = matchday[0];
      matchday[0] = {
        homeTeam: firstMatch.awayTeam,
        awayTeam: firstMatch.homeTeam,
        result: null,
        matchRiggedOptions: {
          isRigged: false,
          homeGoals: -1,
          awayGoals: -1
        }
      };
    }
  });

  // Handle home-away duplication if needed
  let allMatchdays: Match[][] = [...shiftedMatchdays];
  if (homeAway) {
    // Add reversed fixtures for home-away format
    shiftedMatchdays.forEach(matchday => {
      const reversedMatches = matchday.map(({ homeTeam, awayTeam, result }) => ({
        homeTeam: awayTeam,
        awayTeam: homeTeam,
        result,
        matchRiggedOptions: {
          isRigged: false,
          homeGoals: -1,
          awayGoals: -1
        }
      }));
      allMatchdays.push(reversedMatches);
    });
  }

  // Convert to final matches object with 1-indexed matchdays
  allMatchdays.forEach((matchday, index) => {
    matches[index + 1] = matchday;
  });

  return matches;
}

/**
 * Schedules matches for all groups in a competition
 * @param groups Object with group names as keys and team arrays as values
 * @param isHA Boolean indicating if home-and-away format should be used
 * @returns Object with group names as keys and matchday schedules as values
 */
export function GroupStageMatchScheduler(
  groups: { [groupName: string]: string[] },
  isHA: boolean = false
): CompetitionSchedule {
  const schedule: CompetitionSchedule = {};
  
  // Get sorted group names to determine group numbers
  const sortedGroupNames = Object.keys(groups).sort();
  
  sortedGroupNames.forEach((groupName, groupIndex) => {
    const teams = groups[groupName];
    const groupOffset = teams.length - 1; // GROUPOFFSET = number of teams in group - 1
    const calculatedOffset = (groupIndex + 1) % groupOffset; // GROUPNUM % GROUPOFFSET
    
    schedule[groupName] = leagueScheduler(teams, isHA, calculatedOffset);
  });

  return schedule;
}

/**
 * Validates if a competition type supports group stage scheduling
 * @param compType Competition type string
 * @returns Boolean indicating if group stage scheduling is supported
 */
export function supportsGroupStage(compType: string): boolean {
  const supportedTypes = ['GROUPKO', 'GROUPHA', 'GROUP'];
  return supportedTypes.includes(compType);
}

/**
 * Determines if home-and-away format should be used based on competition type
 * @param compType Competition type string
 * @returns Boolean indicating if home-and-away format should be used
 */
export function shouldUseHomeAway(compType: string): boolean {
  return compType === 'GROUPHA';
}

/**
 * Gets all matches from a specific matchday across all groups
 * @param schedule Competition schedule object
 * @param matchday Matchday number (1-indexed)
 * @returns Array of matches with group information
 */
export function getMatchesByMatchday(schedule: CompetitionSchedule, matchday: number): (Match & { group: string })[] {
  const matches: (Match & { group: string })[] = [];
  
  Object.entries(schedule).forEach(([groupName, groupSchedule]) => {
    const dayMatches = groupSchedule[matchday];
    if (dayMatches) {
      dayMatches.forEach(match => {
        matches.push({
          ...match,
          group: groupName
        });
      });
    }
  });
  
  return matches;
}

/**
 * Gets the total number of matchdays in a schedule
 * @param schedule Competition schedule object
 * @returns Maximum matchday number
 */
export function getTotalMatchdays(schedule: CompetitionSchedule): number {
  let maxMatchday = 0;
  
  Object.values(schedule).forEach(groupSchedule => {
    const matchdays = Object.keys(groupSchedule).map(Number);
    const groupMax = Math.max(...matchdays, 0);
    maxMatchday = Math.max(maxMatchday, groupMax);
  });
  
  return maxMatchday;
}

/**
 * Generates a home-away match schedule for pairs of teams
 * @param pairs Array of home-away team pairs
 * @returns Object with matchdays as keys and arrays of matches as values
 */
export function HomeAwayMatchScheduler(pairs: { home: string; away: string }[]): HomeAwaySchedule {
  const schedule: HomeAwaySchedule = {};
  
  // First leg: all home teams play at home
  const firstLegMatches: Match[] = pairs.map(pair => ({
    homeTeam: pair.home,
    awayTeam: pair.away,
    result: null,
    matchRiggedOptions: {
      isRigged: false,
      homeGoals: -1,
      awayGoals: -1
    }
  }));
  
  // Second leg: all away teams play at home (reverse fixture)
  const secondLegMatches: Match[] = pairs.map(pair => ({
    homeTeam: pair.away,
    awayTeam: pair.home,
    result: null,
    matchRiggedOptions: {
      isRigged: false,
      homeGoals: -1,
      awayGoals: -1
    }
  }));
  
  schedule[1] = firstLegMatches;
  schedule[2] = secondLegMatches;
  
  return schedule;
}

/**
 * Generates a knockout match schedule from bracket format
 * @param bracket Object with round numbers as keys and match objects as values
 * @returns Object with matchdays as keys and arrays of matches as values
 */
export function KnockoutMatchScheduler(bracket: Record<number, Record<number, (string | number)[]>>): HomeAwaySchedule {
  const schedule: HomeAwaySchedule = {};
  
  // Convert bracket format to HomeAwaySchedule
  // Each round in the bracket becomes a matchday
  const sortedRounds = Object.keys(bracket).map(Number).sort((a, b) => a - b);
  
  let globalMatchNum = 1; // Use global match numbering across entire bracket
  
  sortedRounds.forEach((round, index) => {
    const roundMatches = bracket[round];
    const matches: Match[] = [];
    
    Object.entries(roundMatches).forEach(([_matchNum, teams]) => {
      // teams array contains [homeTeam, awayTeam]
      // These can be either team names (strings) or match number references (numbers)
      const homeTeam = typeof teams[0] === 'string' ? teams[0] : `Winner of Match ${teams[0]}`;
      const awayTeam = typeof teams[1] === 'string' ? teams[1] : `Winner of Match ${teams[1]}`;
      
      matches.push({
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        result: null,
        matchRiggedOptions: {
          isRigged: false,
          homeGoals: -1,
          awayGoals: -1,
          originalBracketMatchNum: globalMatchNum, // Use global match number
          originalBracketRound: round // Store original bracket round number
        }
      });
      
      globalMatchNum++;
    });
    
    schedule[index + 1] = matches;
  });
  
  return schedule;
}
