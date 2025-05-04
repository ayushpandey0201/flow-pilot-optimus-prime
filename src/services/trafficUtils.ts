
import { SimulationState } from "../types/simulation";

/**
 * Determines traffic level for a given road based on vehicle count
 */
export const determineTrafficLevel = (vehicleCount: number): string => {
  if (vehicleCount < 3) return "low";
  if (vehicleCount < 7) return "medium";
  return "high";
};

/**
 * Creates a state key based on current traffic levels on all roads
 */
export const createStateKey = (roadTraffic: Record<string, number>): string => {
  return `${determineTrafficLevel(roadTraffic["road_west"])}_${determineTrafficLevel(roadTraffic["road_east"])}_${determineTrafficLevel(roadTraffic["road_north"])}_${determineTrafficLevel(roadTraffic["road_south"])}`;
};

// Initial Q-values for each state-action pair
export const createInitialQValues = (): Record<string, number> => {
  const initialQValues: Record<string, number> = {};
  const trafficLevels = ["low", "medium", "high"];

  // Generate all possible traffic state combinations for 4 roads
  for (let w = 0; w < trafficLevels.length; w++) {
    for (let e = 0; e < trafficLevels.length; e++) {
      for (let n = 0; n < trafficLevels.length; n++) {
        for (let s = 0; s < trafficLevels.length; s++) {
          const state = `${trafficLevels[w]}_${trafficLevels[e]}_${trafficLevels[n]}_${trafficLevels[s]}`;
          // Initialize Q-values for both phases (0 and 1)
          initialQValues[`${state}_0`] = 0;
          initialQValues[`${state}_1`] = 0;
        }
      }
    }
  }

  return initialQValues;
};
