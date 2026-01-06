export interface Player {
  firstName: string
  lastName: string
  commonName: string
  age: number
  overall: number
  potential: number
  position: string
  nationality: string
}

export interface NationInfo {
  [key: string]: {
    rankingPts: number
    confederationID: string
    flagCode: string
  }
}

export interface PlayersData {
  [nation: string]: {
    players: Player[]
  }
}
