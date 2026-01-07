import { create } from 'zustand'
import type { Player, PlayersData, NationInfo, Squad } from '../types/rosterManager'
import playersData from '../config/players.json'
import nationInfo from '../config/nation_info.json'
import { generateAllSquads, generateSquad, getPlayerAtPosition, getAllSquadPlayers, findPlayerInSquad, replacePlayerInSquad, getPositionConstraints, getSubstitutePositionConstraints } from '../utils/squadGenerator'

interface PlayersState {
  // Raw data
  playersData: PlayersData
  nationInfo: NationInfo
  
  // Original data (read-only)
  originalAllPlayers: Player[]
  originalPlayersByNation: { [nation: string]: Player[] }
  originalPlayersByPosition: { [position: string]: Player[] }
  originalSquads: { [nation: string]: Squad }
  
  // Revisable data (editable)
  allPlayers: Player[]
  playersByNation: { [nation: string]: Player[] }
  playersByPosition: { [position: string]: Player[] }
  squads: { [nation: string]: Squad }
  
  // Initialization state
  isInitialized: boolean
  
  // Game state for added players
  numPlayersAdded: number
  highestPlayerID: number
  
  // Actions
  loadPlayersData: () => void
  loadNationInfo: () => void
  generateSquads: () => void
  initializeData: () => void
  revertToOriginalData: () => void
  updatePlayer: (playerId: number, updates: Partial<Player>) => void
  addPlayer: (player: Omit<Player, 'playerid'>) => void
  updateSquad: (nation: string, squad: Squad) => void
  getPlayerById: (id: number) => Player | undefined
  getPlayersByNation: (nation: string) => Player[]
  getPlayersByPosition: (position: string) => Player[]
  searchPlayers: (query: string) => Player[]
  getNationFlagCode: (nation: string) => string
  getAllNationalities: () => string[]
  getSquad: (nation: string) => Squad | undefined
  getPlayerAtPosition: (nation: string, position: string) => any
  exportSquad: (nation: string) => void
  refreshSquad: (nation: string) => void
  exportAllSquads: () => void
  exportSelectedSquads: (nations: string[]) => void
}

export const useGlobalStore = create<PlayersState>((set, get) => ({
  // Initialize with empty data
  playersData: {},
  nationInfo: {},
  
  // Original data (read-only)
  originalAllPlayers: [],
  originalPlayersByNation: {},
  originalPlayersByPosition: {},
  originalSquads: {},
  
  // Revisable data (editable)
  allPlayers: [],
  playersByNation: {},
  playersByPosition: {},
  squads: {},
  
  // Initialization state
  isInitialized: false,
  
  // Game state for added players
  numPlayersAdded: 0,
  highestPlayerID: 0,
  
  // Load players data from JSON
  loadPlayersData: () => {
    const data = playersData as unknown as PlayersData
    
    // Process all players
    const allPlayers: Player[] = []
    const playersByNation: { [nation: string]: Player[] } = {}
    const playersByPosition: { [position: string]: Player[] } = {}
    
    Object.entries(data).forEach(([nation, nationData]) => {
      const nationPlayers: Player[] = []
      
      nationData.players.forEach(player => {
        const playerWithNation = {
          ...player,
          nationality: nation
        }
        
        allPlayers.push(playerWithNation)
        nationPlayers.push(playerWithNation)
        
        // Group by position
        if (!playersByPosition[player.position]) {
          playersByPosition[player.position] = []
        }
        playersByPosition[player.position].push(playerWithNation)
      })
      
      playersByNation[nation] = nationPlayers
    })
    
    // Calculate highest player ID
    const highestPlayerID = allPlayers.length > 0 
      ? Math.max(...allPlayers.map(p => p.playerid))
      : 0
    
    set({
      playersData: data,
      originalAllPlayers: [...allPlayers],
      originalPlayersByNation: { ...playersByNation },
      originalPlayersByPosition: { ...playersByPosition },
      allPlayers,
      playersByNation,
      playersByPosition,
      highestPlayerID
    })
  },
  
  // Load nation info data from JSON
  loadNationInfo: () => {
    const data = nationInfo as NationInfo
    set({ nationInfo: data })
  },
  
  // Generate squads for all nations
  generateSquads: () => {
    const { playersByNation } = get()
    const squads = generateAllSquads(playersByNation)
    set({ 
      originalSquads: { ...squads },
      squads 
    })
  },
  
  // Initialize data only if not already initialized
  initializeData: () => {
    const { isInitialized } = get()
    if (!isInitialized) {
      get().loadPlayersData()
      get().loadNationInfo()
      get().generateSquads()
      set({ 
        isInitialized: true,
        numPlayersAdded: 0
      })
      console.log("initialization run");
    }
  },
  
  // Revert to original data
  revertToOriginalData: () => {
    const { originalAllPlayers, originalPlayersByNation, originalPlayersByPosition, originalSquads } = get()
    set({
      allPlayers: [...originalAllPlayers],
      playersByNation: { ...originalPlayersByNation },
      playersByPosition: { ...originalPlayersByPosition },
      squads: { ...originalSquads }
    })
  },
  
  // Update a player
  updatePlayer: (playerId: number, updates: Partial<Player>) => {
    const { allPlayers, playersByNation, playersByPosition, squads } = get()
    const playerIndex = allPlayers.findIndex(p => p.playerid === playerId)
    
    if (playerIndex === -1) return
    
    const originalPlayer = allPlayers[playerIndex]
    const updatedPlayer = { ...originalPlayer, ...updates }
    const updatedAllPlayers = [...allPlayers]
    updatedAllPlayers[playerIndex] = updatedPlayer
    
    // Handle squad replacements if nationality changed
    let updatedSquads = { ...squads }
    if (originalPlayer.nationality !== updatedPlayer.nationality) {
      const oldNationSquad = squads[originalPlayer.nationality]
      if (oldNationSquad) {
        // Check if player is in old nation's squad
        const squadPlayerInfo = findPlayerInSquad(oldNationSquad, playerId)
        
        if (squadPlayerInfo) {
          const { position, isSubstitute, squadSlot } = squadPlayerInfo
          const oldNationPlayers = playersByNation[originalPlayer.nationality] || []
          const currentSquadPlayers = getAllSquadPlayers(oldNationSquad)
          
          // Get eligible positions based on whether player is starter or substitute
          const eligiblePositions = isSubstitute 
            ? getSubstitutePositionConstraints(position)
            : getPositionConstraints(position)
          
          // Find best replacement player (highest overall, then potential)
          const availableReplacements = oldNationPlayers.filter(p => 
            !currentSquadPlayers.some(sp => sp.playerid === p.playerid) &&
            eligiblePositions.includes(p.position)
          )
          
          const bestReplacement = availableReplacements.length > 0 
            ? availableReplacements.sort((a, b) => {
                if (b.overall !== a.overall) return b.overall - a.overall
                return b.potential - a.potential
              })[0]
            : null
          
          if (bestReplacement) {
            // Replace player in old squad with best replacement
            updatedSquads[originalPlayer.nationality] = replacePlayerInSquad(
              oldNationSquad,
              bestReplacement,
              squadSlot
            )
          } else {
            // No replacement found - create empty slot
            const emptyPlayer: Player = {
              playerid: -1,
              firstName: 'Empty',
              lastName: 'Slot',
              commonName: 'Empty Slot',
              age: 0,
              overall: 0,
              potential: 0,
              position: position,
              nationality: originalPlayer.nationality
            }
            
            updatedSquads[originalPlayer.nationality] = replacePlayerInSquad(
              oldNationSquad,
              emptyPlayer,
              squadSlot
            )
          }
        }
      }
    }
    
    // Update playersByNation
    const updatedPlayersByNation = { ...playersByNation }
    
    // If nationality changed, remove from old nation
    if (originalPlayer.nationality !== updatedPlayer.nationality) {
      const oldNationPlayers = updatedPlayersByNation[originalPlayer.nationality]?.filter(p => 
        p.playerid !== playerId
      ) || []
      updatedPlayersByNation[originalPlayer.nationality] = oldNationPlayers
    }
    
    // Add/update in new nation
    const nationPlayers = updatedPlayersByNation[updatedPlayer.nationality]?.map(p => 
      p.playerid === playerId ? updatedPlayer : p
    ) || []
    
    // If player wasn't in the new nation list, add them
    if (!nationPlayers.some(p => p.playerid === playerId)) {
      nationPlayers.push(updatedPlayer)
    }
    
    updatedPlayersByNation[updatedPlayer.nationality] = nationPlayers
    
    // Update playersByPosition
    const updatedPlayersByPosition = { ...playersByPosition }
    
    // If position changed, remove from old position
    if (originalPlayer.position !== updatedPlayer.position) {
      const oldPositionPlayers = updatedPlayersByPosition[originalPlayer.position]?.filter(p => 
        p.playerid !== playerId
      ) || []
      updatedPlayersByPosition[originalPlayer.position] = oldPositionPlayers
    }
    
    // Add/update in new position
    const positionPlayers = updatedPlayersByPosition[updatedPlayer.position]?.map(p => 
      p.playerid === playerId ? updatedPlayer : p
    ) || []
    
    // If player wasn't in the new position list, add them
    if (!positionPlayers.some(p => p.playerid === playerId)) {
      positionPlayers.push(updatedPlayer)
    }
    
    updatedPlayersByPosition[updatedPlayer.position] = positionPlayers
    
    set({
      allPlayers: updatedAllPlayers,
      playersByNation: updatedPlayersByNation,
      playersByPosition: updatedPlayersByPosition,
      squads: updatedSquads
    })
  },
  
  // Add a new player
  addPlayer: (playerData: Omit<Player, 'playerid'>) => {
    const { allPlayers, playersByNation, playersByPosition, highestPlayerID, numPlayersAdded } = get()
    
    // Generate new player ID
    const newPlayerId = highestPlayerID + numPlayersAdded + 1
    
    // Create new player object
    const newPlayer: Player = {
      ...playerData,
      playerid: newPlayerId
    }
    
    // Update all players array
    const updatedAllPlayers = [...allPlayers, newPlayer]
    
    // Update playersByNation
    const updatedPlayersByNation = { ...playersByNation }
    if (!updatedPlayersByNation[newPlayer.nationality]) {
      updatedPlayersByNation[newPlayer.nationality] = []
    }
    updatedPlayersByNation[newPlayer.nationality].push(newPlayer)
    
    // Update playersByPosition
    const updatedPlayersByPosition = { ...playersByPosition }
    if (!updatedPlayersByPosition[newPlayer.position]) {
      updatedPlayersByPosition[newPlayer.position] = []
    }
    updatedPlayersByPosition[newPlayer.position].push(newPlayer)
    
    set({
      allPlayers: updatedAllPlayers,
      playersByNation: updatedPlayersByNation,
      playersByPosition: updatedPlayersByPosition,
      numPlayersAdded: numPlayersAdded + 1
    })
  },
  
  // Update a squad
  updateSquad: (nation: string, squad: Squad) => {
    const { squads } = get()
    set({
      squads: { ...squads, [nation]: squad }
    })
  },
  
  // Get player by unique identifier
  getPlayerById: (id: number) => {
    const { allPlayers } = get()
    return allPlayers.find(player => player.playerid === id)
  },
  
  // Get players by nationality
  getPlayersByNation: (nation: string) => {
    const { playersByNation } = get()
    return playersByNation[nation] || []
  },
  
  // Get players by position
  getPlayersByPosition: (position: string) => {
    const { playersByPosition } = get()
    return playersByPosition[position] || []
  },
  
  // Search players by name
  searchPlayers: (query: string) => {
    const { allPlayers } = get()
    const lowercaseQuery = query.toLowerCase()
    
    return allPlayers.filter(player => {
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase()
      const commonName = player.commonName.toLowerCase()
      return fullName.includes(lowercaseQuery) || commonName.includes(lowercaseQuery)
    })
  },
  
  // Get nation flag code
  getNationFlagCode: (nationName: string) => {
    const { nationInfo } = get()
    const nation = nationInfo[nationName]
    return nation ? nation.flagCode : ''
  },
  
  // Get all nationalities
  getAllNationalities: () => {
    const { nationInfo } = get()
    return Object.keys(nationInfo).sort()
  },
  
  // Get squad for a nation
  getSquad: (nation: string) => {
    const { squads } = get()
    return squads[nation]
  },
  
  // Get player at specific position in nation's squad
  getPlayerAtPosition: (nation: string, position: string) => {
    const { squads } = get()
    const squad = squads[nation]
    if (!squad) return null
    return getPlayerAtPosition(squad, position)
  },
  
  // Export squad to JSON file
  exportSquad: (nation: string) => {
    const { squads } = get()
    const squad = squads[nation]
    if (!squad) return
    
    // Create filename with timestamp
    const now = new Date()
    const timestamp = now.getFullYear().toString() +
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0') +
                     now.getHours().toString().padStart(2, '0') +
                     now.getMinutes().toString().padStart(2, '0') +
                     now.getSeconds().toString().padStart(2, '0')
    
    const filename = `${nation}-${timestamp}.json`
    
    // Convert squad to JSON and create blob
    const jsonData = JSON.stringify(squad, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    
    // Create download link and trigger download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
  
  // Refresh squad for a nation
  refreshSquad: (nation: string) => {
    const { playersByNation } = get()
    const nationPlayers = playersByNation[nation]
    
    if (!nationPlayers || nationPlayers.length < 19) {
      console.warn(`Cannot refresh squad for ${nation}: ${nationPlayers?.length || 0} players available, need at least 19`)
      return
    }
    
    // Generate new squad using current player data
    const newSquad = generateSquad(nation, nationPlayers)
    
    if (newSquad) {
      // Update the squad in the store
      set(state => ({
        squads: {
          ...state.squads,
          [nation]: newSquad
        }
      }))
    } else {
      console.warn(`Failed to generate squad for ${nation}`)
    }
  },
  
  // Export all squads to JSON file
  exportAllSquads: () => {
    const { squads } = get()
    
    // Create filename with timestamp
    const now = new Date()
    const timestamp = now.getFullYear().toString() +
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0') +
                     now.getHours().toString().padStart(2, '0') +
                     now.getMinutes().toString().padStart(2, '0') +
                     now.getSeconds().toString().padStart(2, '0')
    
    const filename = `all-squads-${timestamp}.json`
    
    // Convert squads to JSON and create blob
    const jsonData = JSON.stringify(squads, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    
    // Create download link and trigger download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
  
  // Export selected squads to JSON file
  exportSelectedSquads: (nations: string[]) => {
    const { squads } = get()
    
    // Filter squads for selected nations
    const selectedSquads: { [nation: string]: Squad } = {}
    nations.forEach(nation => {
      if (squads[nation]) {
        selectedSquads[nation] = squads[nation]
      }
    })
    
    // Create filename with timestamp
    const now = new Date()
    const timestamp = now.getFullYear().toString() +
                     (now.getMonth() + 1).toString().padStart(2, '0') +
                     now.getDate().toString().padStart(2, '0') +
                     now.getHours().toString().padStart(2, '0') +
                     now.getMinutes().toString().padStart(2, '0') +
                     now.getSeconds().toString().padStart(2, '0')
    
    const filename = `selected-squads-${timestamp}.json`
    
    // Convert selected squads to JSON and create blob
    const jsonData = JSON.stringify(selectedSquads, null, 2)
    const blob = new Blob([jsonData], { type: 'application/json' })
    
    // Create download link and trigger download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}))
