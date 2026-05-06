import { useGlobalStore } from "../../state/GlobalState";
import bProb from '../../config/name_info/base_probs.json'  with { type: 'json' };
import dualNats from '../../config/name_info/dual_nats.json'  with { type: 'json' };
import { fullMappings } from '../../config/name_info/groups';
import { generateNameSplit } from "fifa-name-generator";
import { generateNewgenOvrPot } from "./NewgenOverall";

export interface GeneratedName {
  firstName: string;
  lastName: string;
  nationality: string;
  secondaryNationality?: string;
}

export interface NameOutput {
  firstName: string;
  lastName: string;
}

export interface RegenPlayer {
    firstName: string;
    lastName: string;
    commonName: string;
    nationality: string;
    age: number;
    overall: number;
    potential: number;
    position: string;
}

const POSITIONS = ["GK", "LB", "CB", "CB", "RB", "CAM", "CDM", "CM", "LW", "RW", "ST"];
const DUAL_NATIONALITIES = dualNats as Record<string, Record<string, number>>;
const BASE_PROBS = bProb as Record<string, number>;
const EUR_GROUPS = fullMappings as Record<string, Record<string, Record<string, number>>>;

export function getAllNations(): string[] {
    return Object.keys(useGlobalStore.getState().nationInfo);
}

export function getAllNationCodes(): string[] {
    return getAllNations().map(nation => useGlobalStore.getState().nationInfo[nation].threeLetterCode);
}

export function realisticNameGenerator(nation: string): GeneratedName {
  //first we rand gen a probability
  const num = Math.random();
  const nationality = useGlobalStore.getState().nationInfo[nation].threeLetterCode;
  const fullPrimaryNatName = nation;
  //if num > our cap, no second nat and just gen a nation
  if(num > BASE_PROBS[nationality]) {
    const genName : NameOutput = generateNameSplit(nationality);
    return {
      firstName: genName.firstName,
      lastName: genName.lastName,
      nationality: fullPrimaryNatName
    };
  } else {
    //let's get our 2nd nationality
    const randNat = getRandomNationality(DUAL_NATIONALITIES[nationality]);
    //there are some special cases for the second nationality, so let's cover them
    //there are 3 cases: 3-letter abbrev, 'GENERAL', or a continent name
    switch(randNat!.length) {
      case 3:
        //this is a nation
        const genAbbrName : NameOutput = generateNameSplit(nationality, randNat);
        return {
          firstName: genAbbrName.firstName,
          lastName: genAbbrName.lastName,
          nationality: fullPrimaryNatName
        };
      case 7:
        //this is 'general'
        const newArr = [...new Set([...getAllNationCodes()].filter(code => code !== nationality))];
        const secGenNat = newArr[Math.floor(Math.random() * newArr.length)];
        const genGeneralName : NameOutput = generateNameSplit(nationality, secGenNat);
        return {
          firstName: genGeneralName.firstName,
          lastName: genGeneralName.lastName,
          nationality: fullPrimaryNatName
        };
      default:
        //this is the continent case
        const countryDict = EUR_GROUPS[nationality][randNat!];
        const secNat = getRandomNationality(countryDict)!;
        const genContiName : NameOutput = generateNameSplit(nationality, secNat);
        return {
          firstName: genContiName.firstName,
          lastName: genContiName.lastName,
          nationality: fullPrimaryNatName
        };
    }
  }
}

export function getRandomNationality(probabilities: Record<string, number>) {
  const entries = Object.entries(probabilities);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let r = Math.random() * total;

  for (const [key, weight] of entries) {
    if (r < weight) return key;
    r -= weight;
  }

  return undefined; // fallback (shouldn't happen if values > 0)
}

// ------- BULK REGEN GENERATION -------

export function generateRegenClass(): RegenPlayer[] {
    const nations = getAllNations();
    let players: RegenPlayer[] = [];
    
    // 1. Loop through nations and positions
    for (const nation of nations) {
        for (const position of POSITIONS) {
            // 2. Generate name
            const nameGen = realisticNameGenerator(nation);
            
            // 3. Generate Ovr/Pot
            const nationInfo = useGlobalStore.getState().nationInfo[nation];
            const ovrPot = generateNewgenOvrPot(nationInfo.youthRating, 15, false);
            
            // 4. Create RegenPlayer object
            const player: RegenPlayer = {
                firstName: nameGen.firstName,
                lastName: nameGen.lastName,
                commonName: "",
                nationality: nameGen.nationality,
                age: 15,
                overall: ovrPot.currentAbility,
                potential: ovrPot.potentialAbility,
                position: position
            };
            
            players.push(player);
        }
    }
    
    // 5. Find highest potential rating
    const minPotential = Math.min(...players.map(p => p.potential));
    const maxPotential = Math.max(...players.map(p => p.potential));
    
    // 6. Scale overalls to range 30-60
    const minOverall = Math.min(...players.map(p => p.overall));
    const maxOverall = Math.max(...players.map(p => p.overall));

    const MIN_OVERALL = 30;
    const MAX_OVERALL = 60;
    const MIN_POT = 40;
    
    // 7. Scale potentials to range 40-MAX_POTENTIAL/2
    const scaledPlayers = players.map(player => {
        // Scale overall (minOverall-maxOverall) -> (30-60)
        const scaledOverall = (((player.overall - minOverall) / (maxOverall - minOverall)) * (MAX_OVERALL - MIN_OVERALL)) + MIN_OVERALL;
        
        // Scale potential (0-maxPotential) -> (40-MAX_POTENTIAL/2)
        const scaledPotential = (((player.potential - minPotential) / (maxPotential - minPotential)) * ((maxPotential / 2) - MIN_POT)) + MIN_POT;
        
        return {
            ...player,
            overall: Math.round(scaledOverall),
            potential: Math.round(scaledPotential)
        };
    });
    
    // Select 10 players at complete random and update their potentials
    const finalPlayers = [...scaledPlayers];
    const randomIndices = new Set<number>();
    
    // Get 10 unique random indices
    while (randomIndices.size < 5 && randomIndices.size < finalPlayers.length) {
        randomIndices.add(Math.floor(Math.random() * finalPlayers.length));
    }
    
    // Update potentials for selected players
    randomIndices.forEach(index => {
        const randomHighPotential = Math.floor(Math.random() * 5) + 91; // 91-95
        const currentPotential = finalPlayers[index].potential;
        
        // Set potential to max between current one or random 91-95
        finalPlayers[index] = {
            ...finalPlayers[index],
            potential: Math.max(currentPotential, randomHighPotential)
        };
    });
    
    return finalPlayers;
}