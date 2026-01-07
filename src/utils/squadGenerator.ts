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

// Get position constraints for starters
export const getPositionConstraints = (position: string): string[] => {
  const constraints: { [key: string]: string[] } = {
    'GK': ['GK'],
    'RB': ['RB'],
    'LB': ['LB'],
    'CB': ['CB'],
    'CDM': ['CDM', 'CM'],
    'CM': ['CM', 'CDM', 'CAM'],
    'CAM': ['CM', 'CAM'],
    'RW': ['RW', 'RM'],
    'LW': ['LW', 'LM'],
    'RM': ['RM', 'RW'],
    'LM': ['LM', 'LW'],
    'ST': ['ST']
  }
  return constraints[position] || [position]
}

// Get position constraints for substitutes
export const getSubstitutePositionConstraints = (position: string): string[] => {
  const constraints: { [key: string]: string[] } = {
    'GK': ['GK'],
    'RB': ['RB','LB','CB'],
    'LB': ['LB','RB','CB'],
    'CB': ['CB','RB','LB'],
    'CDM': ['CDM', 'CM','CAM'],
    'CM': ['CM', 'CDM', 'CAM'],
    'CAM': ['CM', 'CAM', 'CDM'],
    'RW': ['RW', 'RM', 'LW', 'LM','ST'],
    'LW': ['RW', 'RM', 'LW', 'LM','ST'],
    'RM': ['RW', 'RM', 'LW', 'LM','ST'],
    'LM': ['RW', 'RM', 'LW', 'LM','ST'],
    'ST': ['RW', 'RM', 'LW', 'LM','ST']
  }
  return constraints[position] || [position]
}

// Find best replacement player for a squad position
export const findReplacementPlayer = (
  nationPlayers: Player[],
  squadPlayers: Player[],
  position: string,
  isSubstitute: boolean = false
): Player | null => {
  const constraints = isSubstitute 
    ? getSubstitutePositionConstraints(position)
    : getPositionConstraints(position)
  
  const usedPlayerIds = new Set(squadPlayers.map(p => p.playerid))
  
  const availablePlayers = nationPlayers.filter(player => 
    constraints.includes(player.position) && 
    !usedPlayerIds.has(player.playerid)
  )
  
  if (availablePlayers.length === 0) return null
  
  // Sort by overall rating, then potential
  return availablePlayers.sort((a, b) => {
    if (b.overall !== a.overall) return b.overall - a.overall
    return b.potential - a.potential
  })[0]
}

// Get all players from a squad
export const getAllSquadPlayers = (squad: Squad): Player[] => {
  const players: Player[] = []
  
  // Add starters
  if (squad.starters.gk) players.push(squad.starters.gk.player)
  squad.starters.defenders.forEach(d => d && players.push(d.player))
  squad.starters.midfielders.forEach(m => m && players.push(m.player))
  squad.starters.forwards.forEach(f => f && players.push(f.player))
  
  // Add substitutes
  if (squad.substitutes.gk) players.push(squad.substitutes.gk.player)
  squad.substitutes.defenders.forEach(d => d && players.push(d.player))
  squad.substitutes.midfielders.forEach(m => m && players.push(m.player))
  squad.substitutes.forwards.forEach(f => f && players.push(f.player))
  
  return players
}

// Find a player in a squad and return position info
export const findPlayerInSquad = (
  squad: Squad, 
  playerId: number
): { position: string; isSubstitute: boolean; squadSlot: string } | null => {
  // Check starters
  if (squad.starters.gk?.player.playerid === playerId) {
    return { position: 'GK', isSubstitute: false, squadSlot: 'starters.gk' }
  }
  
  for (let i = 0; i < squad.starters.defenders.length; i++) {
    const defender = squad.starters.defenders[i]
    if (defender?.player.playerid === playerId) {
      const positions = ['RB', 'CB', 'CB', 'LB']
      return { position: positions[i], isSubstitute: false, squadSlot: `starters.defenders.${i}` }
    }
  }
  
  for (let i = 0; i < squad.starters.midfielders.length; i++) {
    const midfielder = squad.starters.midfielders[i]
    if (midfielder?.player.playerid === playerId) {
      const positions = ['CDM', 'CM', 'CAM'] // Map to single positions
      return { position: positions[i], isSubstitute: false, squadSlot: `starters.midfielders.${i}` }
    }
  }
  
  for (let i = 0; i < squad.starters.forwards.length; i++) {
    const forward = squad.starters.forwards[i]
    if (forward?.player.playerid === playerId) {
      const positions = ['RW', 'LW', 'ST'] // Map to single positions
      return { position: positions[i], isSubstitute: false, squadSlot: `starters.forwards.${i}` }
    }
  }
  
  // Check substitutes
  if (squad.substitutes.gk?.player.playerid === playerId) {
    return { position: 'GK', isSubstitute: true, squadSlot: 'substitutes.gk' }
  }
  
  for (let i = 0; i < squad.substitutes.defenders.length; i++) {
    const defender = squad.substitutes.defenders[i]
    if (defender?.player.playerid === playerId) {
      return { position: 'CB', isSubstitute: true, squadSlot: `substitutes.defenders.${i}` }
    }
  }
  
  for (let i = 0; i < squad.substitutes.midfielders.length; i++) {
    const midfielder = squad.substitutes.midfielders[i]
    if (midfielder?.player.playerid === playerId) {
      return { position: 'CM', isSubstitute: true, squadSlot: `substitutes.midfielders.${i}` }
    }
  }
  
  for (let i = 0; i < squad.substitutes.forwards.length; i++) {
    const forward = squad.substitutes.forwards[i]
    if (forward?.player.playerid === playerId) {
      return { position: 'ST', isSubstitute: true, squadSlot: `substitutes.forwards.${i}` }
    }
  }
  
  return null
}

// Replace a player in a squad at a specific slot
export const replacePlayerInSquad = (
  squad: Squad,
  newPlayer: Player,
  squadSlot: string
): Squad => {
  const newSquad = JSON.parse(JSON.stringify(squad)) as Squad
  const parts = squadSlot.split('.')
  
  if (parts[0] === 'starters') {
    if (parts[1] === 'gk') {
      newSquad.starters.gk = { player: newPlayer }
    } else if (parts.length === 3) {
      const subSection = parts[1] as 'defenders' | 'midfielders' | 'forwards'
      const index = parseInt(parts[2])
      
      if (!isNaN(index) && index >= 0 && index < newSquad.starters[subSection].length) {
        newSquad.starters[subSection][index] = { player: newPlayer }
      }
    }
  } else if (parts[0] === 'substitutes') {
    if (parts[1] === 'gk') {
      newSquad.substitutes.gk = { player: newPlayer }
    } else if (parts.length === 3) {
      const subSection = parts[1] as 'defenders' | 'midfielders' | 'forwards'
      const index = parseInt(parts[2])
      
      if (!isNaN(index) && index >= 0 && index < newSquad.substitutes[subSection].length) {
        newSquad.substitutes[subSection][index] = { player: newPlayer }
      }
    }
  }
  
  return newSquad
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
  const filledPositions: { [key: string]: number } = {}
  
  for (const requirement of STARTER_POSITIONS) {
    for (let i = 0; i < requirement.count; i++) {
      const bestPlayer = getBestPlayerForPosition(sortedPlayers, requirement.eligiblePositions, usedPlayers)
      
      if (!bestPlayer) {
        console.warn(`Could not find player for ${requirement.position} (${i + 1}) in ${nation}`)
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
          if (!filledPositions['CB']) {
            starters.defenders[1] = squadPlayer
            filledPositions['CB'] = 1
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
