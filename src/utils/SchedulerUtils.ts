// Types for match scheduling
export interface Match {
  homeTeam: string;
  awayTeam: string;
}

export interface GroupMatchSchedule {
  [matchday: number]: Match[];
}

export interface CompetitionSchedule {
  [groupName: string]: GroupMatchSchedule;
}

/**
 * Generates a round-robin schedule for a group of teams
 * @param teams Array of team names
 * @param homeAway Boolean indicating if home-and-away format should be used
 * @returns Object with matchdays as keys and arrays of matches as values
 */
export function leagueScheduler(teams: string[], homeAway: boolean): GroupMatchSchedule {
  const matches: GroupMatchSchedule = {};
  let modifiedTeams = [...teams];

  // Add dummy team if odd number of teams
  if (modifiedTeams.length % 2 === 1) {
    modifiedTeams.push("X");
  }

  let iterations = modifiedTeams.length - 1;
  
  if (homeAway) {
    iterations *= 2;
  }

  for (let i = 0; i < iterations; i++) {
    if (i < modifiedTeams.length - 1) { 
      const matchups: Match[] = [];
      for (let j = 0; j < Math.floor(modifiedTeams.length / 2); j++) {
        const team1 = modifiedTeams[j];
        const team2 = modifiedTeams[modifiedTeams.length - 1 - j];
        if (team1 !== "X" && team2 !== "X") {
          matchups.push({
            homeTeam: team1,
            awayTeam: team2
          });
        }
      }
      matches[i + 1] = matchups; // Matchdays are 1-indexed
      const cycleOut = modifiedTeams.pop()!;
      modifiedTeams.splice(1, 0, cycleOut);
    } else {
      // For home-away, reverse the fixtures from the first half
      const firstHalfMatchday = i - modifiedTeams.length + 2;
      matches[i + 1] = matches[firstHalfMatchday].map(({ homeTeam, awayTeam }) => ({
        homeTeam: awayTeam,
        awayTeam: homeTeam
      }));
    }
  }

  // Flip home and away teams for all even matchdays
  Object.keys(matches).forEach(matchday => {
    const matchdayNum = parseInt(matchday);
    if (matchdayNum % 2 === 0) {
      matches[matchdayNum] = matches[matchdayNum].map(({ homeTeam, awayTeam }) => ({
        homeTeam: awayTeam,
        awayTeam: homeTeam
      }));
    }
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

  Object.keys(groups).forEach(groupName => {
    const teams = groups[groupName];
    schedule[groupName] = leagueScheduler(teams, isHA);
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
