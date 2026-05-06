import { gauss, truncatedNormal, uniform } from "../MathUtils";

//generates CA and PA in range 1 - 200
export function generateNewgenOvrPot(youthRating: number, age: number, isCrucialImportance: boolean) {
  //range checks

  const AGE_PERCENT: Record<number, number> = {
    15: 0.3,
    16: 0.45,
    17: 0.6
  };

  if(age > 17 || age < 15 || youthRating > 200 || youthRating < 0) {
    throw new Error("Invalid age or youth rating for generating a newgen");
  }

  //PA generation
  const meanPA = 40 + 0.7 * Math.max(1, Math.min(200, youthRating));
  const stddevPA = Math.max(8.0, 20.0 - 0.05 * Math.max(0, youthRating));

  const chanceOutlier = 0.01;
  let PARaw = 60.0;
  if(Math.random() < chanceOutlier) {
    PARaw = meanPA + uniform(25, 45) + gauss(0, stddevPA * 0.6);
  } else {
    PARaw = truncatedNormal(!isCrucialImportance ? meanPA : meanPA + 10, stddevPA, 1.0, 200.0);
  }

  const POTENTIAL = Math.round(Math.max(1, Math.min(200, PARaw)));

  //CA generation
  const baseFrac = AGE_PERCENT[age];

  const noiseStddev = Math.max(2.0, 0.03 * POTENTIAL);
  const CARaw = POTENTIAL * baseFrac + gauss(0, noiseStddev);
  const CA = Math.min(Math.round(CARaw), POTENTIAL - 1);

  const CURRENT = Math.min(Math.max(1, Math.min(200, CA)), POTENTIAL);

  return {
    "currentAbility": CURRENT,
    "potentialAbility": POTENTIAL
  };

}