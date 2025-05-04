
import { SimulationState } from "../types/simulation";
import { trafficLightPhases } from "./trafficData";
import { createStateKey } from "./trafficUtils";

/**
 * Calculates reward based on average waiting time and speed
 * We want to minimize waiting time and maximize speed
 */
export const calculateReward = (
  averageWaitingTime: number, 
  averageSpeed: number, 
  roadTraffic: Record<string, number>, 
  currentPhase: number
): number => {
  // Get the roads that have a green light in the current phase
  const activeRoads = trafficLightPhases[currentPhase].activeRoads;
  
  // Calculate traffic on active roads vs. inactive roads
  const activeRoadTraffic = activeRoads.reduce((sum, roadId) => sum + roadTraffic[roadId], 0);
  const totalTraffic = Object.values(roadTraffic).reduce((a, b) => a + b, 0);
  
  // Calculate how well the traffic light is serving high traffic roads
  const trafficEfficiency = totalTraffic > 0 ? activeRoadTraffic / totalTraffic : 0;
  
  // Combine factors for overall reward calculation
  // Lower waiting time and higher speed mean better performance (higher reward)
  const reward = -averageWaitingTime + averageSpeed * 2 + trafficEfficiency * 10;
  
  return reward;
};

/**
 * Selects an action (traffic light phase) using epsilon-greedy strategy
 * Enhanced to prioritize phases that optimize overall flow
 */
export const selectAction = (
  state: string,
  qValues: Record<string, number>,
  epsilon: number,
  roadTraffic: Record<string, number>,
  adaptiveMode: boolean
): number => {
  // Exploration: random action
  if (Math.random() < epsilon) {
    return Math.floor(Math.random() * trafficLightPhases.length);
  }
  
  // Adaptive mode: analyze traffic patterns to optimize flow
  if (adaptiveMode) {
    const eastWestTraffic = roadTraffic["road_west"] + roadTraffic["road_east"];
    const northSouthTraffic = roadTraffic["road_north"] + roadTraffic["road_south"];
    
    // Choose the phase that serves the direction with more traffic
    if (eastWestTraffic > northSouthTraffic) {
      return 0; // East-West green
    } else {
      return 1; // North-South green
    }
  }
  
  // Exploitation: best action from Q-table
  let bestAction = 0;
  let bestValue = -Infinity;
  
  trafficLightPhases.forEach((phase, index) => {
    const value = qValues[`${state}_${index}`] || 0;
    if (value > bestValue) {
      bestValue = value;
      bestAction = index;
    }
  });
  
  return bestAction;
};

/**
 * Updates Q-values based on the Q-learning algorithm
 */
export const updateQValue = (
  state: string,
  action: number,
  reward: number,
  nextState: string,
  qValues: Record<string, number>,
  learningRate: number,
  discountFactor: number
): Record<string, number> => {
  // Find max Q-value for the next state
  let maxNextQ = -Infinity;
  
  trafficLightPhases.forEach((_, index) => {
    const nextStateActionKey = `${nextState}_${index}`;
    const value = qValues[nextStateActionKey] || 0;
    maxNextQ = Math.max(maxNextQ, value);
  });
  
  // Q-learning update formula: Q(s,a) = Q(s,a) + α * [r + γ * max(Q(s',a')) - Q(s,a)]
  const stateActionKey = `${state}_${action}`;
  const oldValue = qValues[stateActionKey] || 0;
  const newQValues = { ...qValues };
  newQValues[stateActionKey] = 
    oldValue + learningRate * (reward + discountFactor * maxNextQ - oldValue);
  
  return newQValues;
};
