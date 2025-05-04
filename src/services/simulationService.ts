import { SimulationState, SimulationSettings, Vehicle, TrafficLightPhase, TrafficNode, TrafficEdge } from "../types/simulation";

// Define traffic nodes for the circular layout
export const trafficNodes: TrafficNode[] = [
  { id: "e", x: 250, y: 250, hasTrafficLight: true }, // Central node
  { id: "a", x: 400, y: 250, hasTrafficLight: false }, // 0 degrees
  { id: "b", x: 325, y: 375, hasTrafficLight: false }, // 60 degrees
  { id: "c", x: 175, y: 375, hasTrafficLight: false }, // 120 degrees
  { id: "d", x: 100, y: 250, hasTrafficLight: false }, // 180 degrees
  { id: "f", x: 175, y: 125, hasTrafficLight: false }, // 240 degrees
  { id: "g", x: 325, y: 125, hasTrafficLight: false }, // 300 degrees
];

// Define traffic edges (roads)
export const trafficEdges: TrafficEdge[] = [
  { id: "road_a", from: "a", to: "e", length: 150, angle: 0 },
  { id: "road_b", from: "b", to: "e", length: 150, angle: 60 },
  { id: "road_c", from: "c", to: "e", length: 150, angle: 120 },
  { id: "road_d", from: "d", to: "e", length: 150, angle: 180 },
  { id: "road_f", from: "f", to: "e", length: 150, angle: 240 },
  { id: "road_g", from: "g", to: "e", length: 150, angle: 300 },
  
  // Return paths
  { id: "road_a_out", from: "e", to: "a", length: 150, angle: 0 },
  { id: "road_b_out", from: "e", to: "b", length: 150, angle: 60 },
  { id: "road_c_out", from: "e", to: "c", length: 150, angle: 120 },
  { id: "road_d_out", from: "e", to: "d", length: 150, angle: 180 },
  { id: "road_f_out", from: "e", to: "f", length: 150, angle: 240 },
  { id: "road_g_out", from: "e", to: "g", length: 150, angle: 300 },
];

// Define traffic light phases - one for each incoming road
export const trafficLightPhases: TrafficLightPhase[] = [
  { 
    id: 0, 
    name: "A Green", 
    duration: 30, 
    color: "#4ade80",
    activeRoads: ["road_a"]
  },
  { 
    id: 1, 
    name: "B Green", 
    duration: 30, 
    color: "#4ade80",
    activeRoads: ["road_b"]
  },
  { 
    id: 2, 
    name: "C Green", 
    duration: 30, 
    color: "#4ade80",
    activeRoads: ["road_c"]
  },
  { 
    id: 3, 
    name: "D Green", 
    duration: 30, 
    color: "#4ade80",
    activeRoads: ["road_d"]
  },
  { 
    id: 4, 
    name: "F Green", 
    duration: 30, 
    color: "#4ade80",
    activeRoads: ["road_f"]
  },
  { 
    id: 5, 
    name: "G Green", 
    duration: 30, 
    color: "#4ade80",
    activeRoads: ["road_g"]
  },
];

// Initial Q-values for each state-action pair
const initialQValues: Record<string, number> = {};

// Define traffic states (combinations of road traffic levels)
const trafficLevels = ["low", "medium", "high"];

// Initialize Q-values for all possible state-action pairs
trafficLightPhases.forEach((phase) => {
  // Generate all possible traffic state combinations
  for (let a = 0; a < trafficLevels.length; a++) {
    for (let b = 0; b < trafficLevels.length; b++) {
      for (let c = 0; c < trafficLevels.length; c++) {
        for (let d = 0; d < trafficLevels.length; d++) {
          for (let f = 0; f < trafficLevels.length; f++) {
            for (let g = 0; g < trafficLevels.length; g++) {
              const state = `${trafficLevels[a]}_${trafficLevels[b]}_${trafficLevels[c]}_${trafficLevels[d]}_${trafficLevels[f]}_${trafficLevels[g]}`;
              initialQValues[`${state}_${phase.id}`] = 0;
            }
          }
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
    "road_a": 0,
    "road_b": 0,
    "road_c": 0,
    "road_d": 0,
    "road_f": 0,
    "road_g": 0
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
  return `${determineTrafficLevel(roadTraffic["road_a"])}_${determineTrafficLevel(roadTraffic["road_b"])}_${determineTrafficLevel(roadTraffic["road_c"])}_${determineTrafficLevel(roadTraffic["road_d"])}_${determineTrafficLevel(roadTraffic["road_f"])}_${determineTrafficLevel(roadTraffic["road_g"])}`;
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
  
  // Adaptive mode: prioritize roads with high traffic
  if (adaptiveMode) {
    // Find the road with the highest traffic
    let maxTraffic = -1;
    let maxTrafficRoad = "";
    
    Object.entries(roadTraffic).forEach(([roadId, traffic]) => {
      if (traffic > maxTraffic) {
        maxTraffic = traffic;
        maxTrafficRoad = roadId;
      }
    });
    
    // Find the phase that serves this road
    for (let i = 0; i < trafficLightPhases.length; i++) {
      if (trafficLightPhases[i].activeRoads.includes(maxTrafficRoad)) {
        return i;
      }
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
// Note: Removing duplicate exports
export {
  simulateStep,
  generateVehicles,
};
