
import { SimulationState, SimulationSettings, Vehicle, TrafficLightPhase, TrafficNode, TrafficEdge } from "../types/simulation";

// Define traffic nodes for the cross-shaped layout
export const trafficNodes: TrafficNode[] = [
  { id: "e", x: 250, y: 250, hasTrafficLight: true }, // Central node
  { id: "n", x: 250, y: 100, hasTrafficLight: false }, // North
  { id: "e", x: 400, y: 250, hasTrafficLight: false }, // East
  { id: "s", x: 250, y: 400, hasTrafficLight: false }, // South
  { id: "w", x: 100, y: 250, hasTrafficLight: false }, // West
];

// Define traffic edges (roads)
export const trafficEdges: TrafficEdge[] = [
  // Incoming roads
  { id: "road_n", from: "n", to: "e", length: 150, angle: 270 }, // North to center
  { id: "road_e", from: "e", to: "e", length: 150, angle: 0 },   // East to center
  { id: "road_s", from: "s", to: "e", length: 150, angle: 90 },  // South to center
  { id: "road_w", from: "w", to: "e", length: 150, angle: 180 }, // West to center
  
  // Outgoing roads
  { id: "road_n_out", from: "e", to: "n", length: 150, angle: 270 }, // Center to north
  { id: "road_e_out", from: "e", to: "e", length: 150, angle: 0 },   // Center to east
  { id: "road_s_out", from: "e", to: "s", length: 150, angle: 90 },  // Center to south
  { id: "road_w_out", from: "e", to: "w", length: 150, angle: 180 }, // Center to west
];

// Define traffic light phases - combining complementary roads to optimize flow
export const trafficLightPhases: TrafficLightPhase[] = [
  { 
    id: 0, 
    name: "N-S Green", 
    duration: 30, 
    color: "#4ade80",
    activeRoads: ["road_n", "road_s"] // North and South get green simultaneously
  },
  { 
    id: 1, 
    name: "E-W Green", 
    duration: 30, 
    color: "#4ade80",
    activeRoads: ["road_e", "road_w"] // East and West get green simultaneously
  }
];

// Initial Q-values for each state-action pair
const initialQValues: Record<string, number> = {};

// Define traffic states (combinations of road traffic levels)
const trafficLevels = ["low", "medium", "high"];

// Initialize Q-values for all possible state-action pairs
trafficLightPhases.forEach((phase) => {
  // Generate all possible traffic state combinations
  for (let n = 0; n < trafficLevels.length; n++) {
    for (let e = 0; e < trafficLevels.length; e++) {
      for (let s = 0; s < trafficLevels.length; s++) {
        for (let w = 0; w < trafficLevels.length; w++) {
          const state = `${trafficLevels[n]}_${trafficLevels[e]}_${trafficLevels[s]}_${trafficLevels[w]}`;
          initialQValues[`${state}_${phase.id}`] = 0;
        }
      }
    }
  }
});

// Initial simulation state
export const initialSimulationState: SimulationState = {
  isRunning: false,
  step: 0,
  averageWaitingTime: 0,
  averageSpeed: 0,
  vehicleCount: 0,
  qValues: initialQValues,
  currentPhase: 0,
  currentReward: 0,
  epsilon: 0.1,
  learningRate: 0.1,
  discountFactor: 0.9,
  roadTraffic: {
    "road_n": 0,
    "road_e": 0,
    "road_s": 0,
    "road_w": 0
  },
  adaptiveMode: true
};

/**
 * Determines traffic level for a given road based on vehicle count
 */
const determineTrafficLevel = (vehicleCount: number): string => {
  if (vehicleCount < 3) return "low";
  if (vehicleCount < 7) return "medium";
  return "high";
};

/**
 * Creates a state key based on current traffic levels on all roads
 */
export const createStateKey = (roadTraffic: Record<string, number>): string => {
  return `${determineTrafficLevel(roadTraffic["road_n"])}_${determineTrafficLevel(roadTraffic["road_e"])}_${determineTrafficLevel(roadTraffic["road_s"])}_${determineTrafficLevel(roadTraffic["road_w"])}`;
};

/**
 * Calculates reward based on average waiting time and speed
 * We want to minimize waiting time and maximize speed
 */
const calculateReward = (
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
const selectAction = (
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
    const northSouthTraffic = roadTraffic["road_n"] + roadTraffic["road_s"];
    const eastWestTraffic = roadTraffic["road_e"] + roadTraffic["road_w"];
    
    // Choose the phase that serves the direction with more traffic
    if (northSouthTraffic > eastWestTraffic) {
      return 0; // North-South green
    } else {
      return 1; // East-West green
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
const updateQValue = (
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

/**
 * Simulates a step in the traffic simulation
 */
const simulateStep = (
  state: SimulationState,
  settings: SimulationSettings
): SimulationState => {
  // Update vehicle counts on each road with some randomness
  const newRoadTraffic = { ...state.roadTraffic };
  
  // For each road, update traffic with some randomness
  Object.keys(newRoadTraffic).forEach(roadId => {
    // Only update incoming roads
    if (!roadId.includes("_out")) {
      // Add vehicles with probability based on vehicle rate
      if (Math.random() < settings.vehicleRate / 10) {
        newRoadTraffic[roadId] += 1;
      }
      
      // Remove vehicles that pass through green lights
      const roadIsActive = trafficLightPhases[state.currentPhase].activeRoads.includes(roadId);
      if (roadIsActive && newRoadTraffic[roadId] > 0 && Math.random() < 0.3) {
        newRoadTraffic[roadId] -= 1;
      }
    }
  });
  
  // Calculate total number of vehicles
  const newVehicleCount = Object.values(newRoadTraffic).reduce((a, b) => a + b, 0);
  
  // Calculate waiting time based on traffic and current phase
  const activeRoads = trafficLightPhases[state.currentPhase].activeRoads;
  const inactiveRoadTraffic = Object.entries(newRoadTraffic)
    .filter(([roadId]) => !activeRoads.includes(roadId) && !roadId.includes("_out"))
    .reduce((sum, [_, traffic]) => sum + traffic, 0);
  
  // Waiting time increases with inactive road traffic
  const newAverageWaitingTime = Math.max(0, state.averageWaitingTime + 
    (inactiveRoadTraffic > 0 ? 0.2 : -0.1));
  
  // Speed decreases with the total number of vehicles
  const newAverageSpeed = Math.max(0, Math.min(13.9, 13.9 - newVehicleCount * 0.1));
  
  // Determine current state for Q-learning
  const currentState = createStateKey(newRoadTraffic);
  
  // Calculate reward
  const reward = calculateReward(
    newAverageWaitingTime, 
    newAverageSpeed, 
    newRoadTraffic, 
    state.currentPhase
  );
  
  // Select action for the next state using Q-learning
  const nextAction = selectAction(
    currentState, 
    state.qValues, 
    settings.epsilon, 
    newRoadTraffic,
    settings.adaptiveMode
  );
  
  // Update Q-values
  const newQValues = updateQValue(
    currentState,
    state.currentPhase,
    reward,
    currentState, // Next state is the same since we're in a loop
    state.qValues,
    settings.learningRate,
    settings.discountFactor
  );
  
  return {
    ...state,
    step: state.step + 1,
    averageWaitingTime: newAverageWaitingTime,
    averageSpeed: newAverageSpeed,
    vehicleCount: newVehicleCount,
    qValues: newQValues,
    currentPhase: nextAction,
    currentReward: reward,
    epsilon: settings.epsilon,
    learningRate: settings.learningRate,
    discountFactor: settings.discountFactor,
    roadTraffic: newRoadTraffic,
    adaptiveMode: settings.adaptiveMode
  };
};

/**
 * Generates simulated vehicles for visualization
 */
const generateVehicles = (roadTraffic: Record<string, number>, currentPhase: number): Vehicle[] => {
  const vehicles: Vehicle[] = [];
  let vehicleId = 0;
  
  // Generate vehicles for each road based on traffic count
  Object.entries(roadTraffic).forEach(([roadId, count]) => {
    if (count > 0) {
      const edge = trafficEdges.find(e => e.id === roadId);
      if (!edge) return;
      
      const isActive = trafficLightPhases[currentPhase].activeRoads.includes(roadId);
      
      // Calculate positions along the road
      for (let i = 0; i < count; i++) {
        // Calculate position based on road angle and distance from junction
        const distance = (i + 1) * 20 + Math.random() * 10; // Space vehicles apart
        const maxDistance = edge.length - 10; // Keep vehicles on the road
        const scaledDistance = Math.min(distance, maxDistance);
        
        // Convert polar coordinates to cartesian
        const angleRad = (edge.angle * Math.PI) / 180;
        let x, y;
        
        // If the road goes to the center, position vehicles coming from outside
        if (edge.to === "e") {
          const fromNode = trafficNodes.find(n => n.id === edge.from);
          if (!fromNode) continue;
          
          // Vehicles position from outer node towards center
          const distanceRatio = 1 - (scaledDistance / edge.length);
          x = fromNode.x + (trafficNodes[0].x - fromNode.x) * distanceRatio;
          y = fromNode.y + (trafficNodes[0].y - fromNode.y) * distanceRatio;
        } else {
          // For outgoing roads, start from center and go outwards
          const toNode = trafficNodes.find(n => n.id === edge.to);
          if (!toNode) continue;
          
          // Vehicles position from center towards outer node
          const distanceRatio = scaledDistance / edge.length;
          x = trafficNodes[0].x + (toNode.x - trafficNodes[0].x) * distanceRatio;
          y = trafficNodes[0].y + (toNode.y - trafficNodes[0].y) * distanceRatio;
        }
        
        // Calculate speed based on traffic light phase
        const speed = isActive ? 
          Math.random() * 10 + 3 : // Moving
          Math.random() * 2; // Slow or stopped
        
        // Calculate waiting time based on phase
        const waitingTime = !isActive ? 
          Math.random() * 5 : // Waiting
          Math.random() * 0.5; // Little or no waiting
        
        vehicles.push({
          id: `v${vehicleId++}`,
          position: [x, y],
          speed,
          waitingTime,
          roadId
        });
      }
    }
  });
  
  return vehicles;
};

// Export the necessary functions and values
export {
  simulateStep,
  generateVehicles,
};
