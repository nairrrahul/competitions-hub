import type { Player, Squad, SquadPlayer, PositionRequirement } from '../types/rosterManager'

export const STARTER_POSITIONS: PositionRequirement[] = [
  { position: 'GK', eligiblePositions: ['GK'], count: 1 },
  { position: 'RB', eligiblePositions: ['RB'], count: 1 },
  { position: 'CB', eligiblePositions: ['CB'], count: 2 },
  { position: 'LB', eligiblePositions: ['LB'], count: 1 },
  { position: 'CDM/CM', eligiblePositions: ['CDM', 'CM'], count: 1 },
  { position: 'CAM/CM/CDM', eligiblePositions: ['CAM', 'CM', 'CDM'], count: 1 },
  { position: 'CAM/CM', eligiblePositions: ['CAM', 'CM'], count: 1 },
  { position: 'RW/RM', eligiblePositions: ['RW', 'RM'], count: 1 },
  { position: 'LW/LM', eligiblePositions: ['LW', 'LM'], count: 1 },
  { position: 'ST', eligiblePositions: ['ST'], count: 1 }
]

export const SUBSTITUTE_POSITIONS = {
  gk: { eligiblePositions: ['GK'], count: 1 },
  defenders: { eligiblePositions: ['RB', 'CB', 'LB'], count: 2 },
  midfielders: { eligiblePositions: ['CDM', 'CM', 'CAM'], count: 3 },
  forwards: { eligiblePositions: ['ST', 'LW', 'RW', 'LM', 'RM'], count: 2 }
}

const sortPlayersByQuality = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => {
    // Primary sort: overall rating
    if (b.overall !== a.overall) {
      return b.overall - a.overall
    }
    // Secondary sort: potential rating
    if (b.potential !== a.potential) {
      return b.potential - a.potential
    }
    // Tertiary sort: alphabetical order (full name)
    const fullNameA = `${a.firstName} ${a.lastName}`.toLowerCase()
    const fullNameB = `${b.firstName} ${b.lastName}`.toLowerCase()
    return fullNameA.localeCompare(fullNameB)
  })
}

const getBestPlayerForPosition = (
  players: Player[],
  eligiblePositions: string[],
  usedPlayers: Set<string>
): Player | null => {
  const availablePlayers = players.filter(player => 
    eligiblePositions.includes(player.position) && 
    !usedPlayers.has(`${player.firstName}-${player.lastName}-${player.nationality}`)
  )
  
  if (availablePlayers.length === 0) return null
  
  const sortedPlayers = sortPlayersByQuality(availablePlayers)
  return sortedPlayers[0]
}

const createSquadPlayer = (player: Player): SquadPlayer => ({
  player
})

export const generateSquad = (nation: string, players: Player[]): Squad | null => {
  if (players.length < 19) {
    console.warn(`Not enough players for ${nation}: ${players.length} players available, need at least 19`)
    return null
  }

  const usedPlayers = new Set<string>()
  const sortedPlayers = sortPlayersByQuality(players)
  
  // Generate starters
  const starters: Squad['starters'] = {
    gk: null as any,
    defenders: [null as any, null as any, null as any, null as any],
    midfielders: [null as any, null as any, null as any],
    forwards: [null as any, null as any, null as any]
  }

  // Fill starter positions
  for (const requirement of STARTER_POSITIONS) {
    const bestPlayer = getBestPlayerForPosition(sortedPlayers, requirement.eligiblePositions, usedPlayers)
    
    if (!bestPlayer) {
      console.warn(`Could not find player for ${requirement.position} in ${nation}`)
      return null
    }

    const squadPlayer = createSquadPlayer(bestPlayer)
    usedPlayers.add(`${bestPlayer.firstName}-${bestPlayer.lastName}-${bestPlayer.nationality}`)

    // Assign to appropriate position in starters
    switch (requirement.position) {
      case 'GK':
        starters.gk = squadPlayer
        break
      case 'RB':
        starters.defenders[0] = squadPlayer
        break
      case 'CB':
        if (!starters.defenders[1]) {
          starters.defenders[1] = squadPlayer
        } else {
          starters.defenders[2] = squadPlayer
        }
        break
      case 'LB':
        starters.defenders[3] = squadPlayer
        break
      case 'CDM/CM':
        starters.midfielders[0] = squadPlayer
        break
      case 'CAM/CM/CDM':
        starters.midfielders[1] = squadPlayer
        break
      case 'CAM/CM':
        starters.midfielders[2] = squadPlayer
        break
      case 'RW/RM':
        starters.forwards[0] = squadPlayer
        break
      case 'LW/LM':
        starters.forwards[1] = squadPlayer
        break
      case 'ST':
        starters.forwards[2] = squadPlayer
        break
    }
  }

  // Generate substitutes
  const substitutes: Squad['substitutes'] = {
    gk: null as any,
    defenders: [null as any, null as any],
    midfielders: [null as any, null as any, null as any],
    forwards: [null as any, null as any]
  }

  // Fill substitute positions
  const subGk = getBestPlayerForPosition(sortedPlayers, SUBSTITUTE_POSITIONS.gk.eligiblePositions, usedPlayers)
  if (subGk) {
    substitutes.gk = createSquadPlayer(subGk)
    usedPlayers.add(`${subGk.firstName}-${subGk.lastName}-${subGk.nationality}`)
  }

  // Substitute defenders
  for (let i = 0; i < SUBSTITUTE_POSITIONS.defenders.count; i++) {
    const defender = getBestPlayerForPosition(sortedPlayers, SUBSTITUTE_POSITIONS.defenders.eligiblePositions, usedPlayers)
    if (defender) {
      substitutes.defenders[i] = createSquadPlayer(defender)
      usedPlayers.add(`${defender.firstName}-${defender.lastName}-${defender.nationality}`)
    }
  }

  // Substitute midfielders
  for (let i = 0; i < SUBSTITUTE_POSITIONS.midfielders.count; i++) {
    const midfielder = getBestPlayerForPosition(sortedPlayers, SUBSTITUTE_POSITIONS.midfielders.eligiblePositions, usedPlayers)
    if (midfielder) {
      substitutes.midfielders[i] = createSquadPlayer(midfielder)
      usedPlayers.add(`${midfielder.firstName}-${midfielder.lastName}-${midfielder.nationality}`)
    }
  }

  // Substitute forwards
  for (let i = 0; i < SUBSTITUTE_POSITIONS.forwards.count; i++) {
    const forward = getBestPlayerForPosition(sortedPlayers, SUBSTITUTE_POSITIONS.forwards.eligiblePositions, usedPlayers)
    if (forward) {
      substitutes.forwards[i] = createSquadPlayer(forward)
      usedPlayers.add(`${forward.firstName}-${forward.lastName}-${forward.nationality}`)
    }
  }

  return {
    starters,
    substitutes
  }
}

export const generateAllSquads = (playersByNation: { [nation: string]: Player[] }): { [nation: string]: Squad } => {
  const squads: { [nation: string]: Squad } = {}
  
  Object.entries(playersByNation).forEach(([nation, players]) => {
    const squad = generateSquad(nation, players)
    if (squad) {
      squads[nation] = squad
    }
  })
  
  return squads
}

export const getPlayerAtPosition = (squad: Squad, position: string): SquadPlayer | null => {
  // Check starters
  switch (position) {
    case 'GK':
      return squad.starters.gk
    case 'RB':
      return squad.starters.defenders[0]
    case 'CB':
      return squad.starters.defenders[1] || squad.starters.defenders[2]
    case 'LB':
      return squad.starters.defenders[3]
    case 'CDM':
    case 'CM':
    case 'CAM':
      // Check midfielders for eligible positions
      for (const midfielder of squad.starters.midfielders) {
        if (midfielder && ['CDM', 'CM', 'CAM'].includes(midfielder.player.position)) {
          return midfielder
        }
      }
      break
    case 'RW':
    case 'RM':
      if (squad.starters.forwards[0] && ['RW', 'RM'].includes(squad.starters.forwards[0].player.position)) {
        return squad.starters.forwards[0]
      }
      break
    case 'LW':
    case 'LM':
      if (squad.starters.forwards[1] && ['LW', 'LM'].includes(squad.starters.forwards[1].player.position)) {
        return squad.starters.forwards[1]
      }
      break
    case 'ST':
      return squad.starters.forwards[2]
  }
  
  return null
}
