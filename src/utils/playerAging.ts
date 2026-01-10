import type { Player } from '../types/rosterManager'
import { 
  ATK_PEAK_START, 
  ATK_PEAK_END, 
  MID_PEAK_START, 
  MID_PEAK_END, 
  DEF_PEAK_START, 
  DEF_PEAK_END, 
  GK_PEAK_START, 
  GK_PEAK_END 
} from '../config/growthRanges'

// Helper function for random integer between A and B (inclusive)
export const RANDINT = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Position category mappings
const POSITION_CATEGORIES = {
  ATK: ['ST', 'LW', 'LM', 'RW', 'RM'],
  MID: ['CM', 'CAM', 'CDM'],
  DEF: ['RB', 'LB', 'CB'],
  GK: ['GK']
}

// Get peak range for a position
export const getPeakRange = (position: string): { start: number; end: number } => {
  for (const [category, positions] of Object.entries(POSITION_CATEGORIES)) {
    if (positions.includes(position)) {
      switch (category) {
        case 'ATK':
          return { start: ATK_PEAK_START, end: ATK_PEAK_END }
        case 'MID':
          return { start: MID_PEAK_START, end: MID_PEAK_END }
        case 'DEF':
          return { start: DEF_PEAK_START, end: DEF_PEAK_END }
        case 'GK':
          return { start: GK_PEAK_START, end: GK_PEAK_END }
      }
    }
  }
  // Default to MID if position not found
  return { start: MID_PEAK_START, end: MID_PEAK_END }
}

// Calculate overall change for a single year of aging
export const calculateOverallChange = (player: Player): number => {
  const { age, overall, potential, position } = player
  const { start: peakStart, end: peakEnd } = getPeakRange(position)
  
  let newOverall = overall
  
  // Case 1: Before Peak Range
  if (age < peakStart) {
    if (age < 19) {
      newOverall = Math.min(potential, overall + RANDINT(3, 5) * (19 - age))
    } else {
      newOverall = Math.min(potential, overall + (RANDINT(4, 7 + (age - 18)) / (age - 18)))
    }
  }
  // Case 2: Within Peak Range
  else if (age >= peakStart && age <= peakEnd) {
    if (overall < 0.7 * potential) {
      newOverall = overall + 0.3 * (potential - overall)
    } else {
      newOverall = Math.min(overall + RANDINT(-2, 2), potential)
    }
  }
  // Case 3: After Peak Range
  else {
    newOverall = overall - (0.5 * RANDINT(1, 2) * (age - peakEnd))
  }
  
  // Ensure overall doesn't go below 20 or above potential
  newOverall = Math.max(20, Math.min(potential, newOverall))
  
  return Math.round(newOverall) // Round to nearest integer
}

// Age a single player by specified years
export const agePlayer = (player: Player, years: number): Player => {
  let agedPlayer = { ...player }
  
  for (let i = 0; i < years; i++) {
    agedPlayer.age += 1
    agedPlayer.overall = calculateOverallChange(agedPlayer)
  }
  
  return agedPlayer
}

// Age all players in an array by specified years
export const ageAllPlayers = (players: Player[], years: number): Player[] => {
  return players.map(player => agePlayer(player, years))
}
