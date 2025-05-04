import { SimulationState, SimulationSettings, Vehicle, TrafficLightPhase, TrafficNode, TrafficEdge } from "../types/simulation";

// Define traffic nodes for the simple T-junction layout
export const trafficNodes: TrafficNode[] = [
  { id: "center", x: 250, y: 250, hasTrafficLight: true }, // Central node/junction
  { id: "west", x: 100, y: 250, hasTrafficLight: false },  // West point
  { id: "east", x: 400, y: 250, hasTrafficLight: false },  // East point
  { id: "north", x: 250, y: 100, hasTrafficLight: false }, // North point
  { id: "south", x: 250, y: 400, hasTrafficLight: false }, // South point
];

// Define traffic edges (roads)
export const trafficEdges: TrafficEdge[] = [
  // Main road (horizontal)
  { id: "road_west", from: "west", to: "center", length: 150, angle: 0 },
  { id: "road_east", from: "east", to: "center", length: 150, angle: 180 },
  
  // Cross road (vertical)
  { id: "road_north", from: "north", to: "center", length: 150, angle: 90 },
  { id: "road_south", from: "south", to: "center", length: 150, angle: 270 },
  
  // Outgoing roads
  { id: "road_west_out", from: "center", to: "west", length: 150, angle: 180 },
  { id: "road_east_out", from: "center", to: "east", length: 150, angle: 0 },
  { id: "road_north_out", from: "center", to: "north", length: 150, angle: 270 },
  { id: "road_south_out", from: "center", to: "south", length: 150, angle: 90 },
];

// Define traffic light phases
export const trafficLightPhases: TrafficLightPhase[] = [
  { 
    id: 0, 
    name: "East-West Green", 
    duration: 30, 
    color: "#4ade80",
    activeRoads: ["road_west", "road_east"] // Main road gets green
  },
  { 
    id: 1, 
    name: "North-South Green", 
    duration: 30, 
    color: "#4ade80",
    activeRoads: ["road_north", "road_south"] // Cross road gets green
  }
];

// Initial Q-values for each state-action pair
const initialQValues: Record<string, number> = {};

// Define traffic states (combinations of road traffic levels)
const trafficLevels = ["low", "medium", "high"];

// Initialize Q-values for all possible state-action pairs
trafficLightPhases.forEach((phase) => {
  // Generate all possible traffic state combinations for 4 roads
  for (let w = 0; w < trafficLevels.length; w++) {
    for (let e = 0; e < trafficLevels.length; e) {
      for (let n = 0; n < trafficLevels.length; n++) {
        for (let s = 0; s < trafficLevels.length; s++) {
          const state = `${trafficLevels[w]}_${trafficLevels[e]}_${trafficLevels[n]}_${trafficLevels[s]}`;
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
    "road_west": 0,
    "road_east": 0,
    "road_north": 0,
    "road_south": 0
  },
  nodeTrafficState: {
    "center": { vehicleCount: 0, waitingTime: 0, signalColor: "#4ade80" },
    "west": { vehicleCount: 0, waitingTime: 0, signalColor: "#ef4444" },
    "east": { vehicleCount: 0, waitingTime: 0, signalColor: "#ef4444" },
    "north": { vehicleCount: 0, waitingTime: 0, signalColor: "#ef4444" },
    "south": { vehicleCount: 0, waitingTime: 0, signalColor: "#ef4444" }
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
  return `${determineTrafficLevel(roadTraffic["road_west"])}_${determineTrafficLevel(roadTraffic["road_east"])}_${determineTrafficLevel(roadTraffic["road_north"])}_${determineTrafficLevel(roadTraffic["road_south"])}`;
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
  const newNodeTrafficState = { ...state.nodeTrafficState };
  
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

  // Update node traffic states
  // Center node has the traffic light
  newNodeTrafficState["center"] = {
    vehicleCount: Math.min(
      newRoadTraffic["road_west"] + newRoadTraffic["road_east"] + 
      newRoadTraffic["road_north"] + newRoadTraffic["road_south"], 
      10
    ),
    waitingTime: inactiveRoadTraffic > 0 ? newAverageWaitingTime : 0,
    signalColor: trafficLightPhases[state.currentPhase].color
  };

  // Other nodes - vehicles waiting to enter
  trafficNodes.forEach(node => {
    if (node.id !== "center") {
      const incomingRoadId = `road_${node.id}`;
      const isActive = activeRoads.includes(incomingRoadId);
      newNodeTrafficState[node.id] = {
        vehicleCount: newRoadTraffic[incomingRoadId] || 0,
        waitingTime: isActive ? 0 : newAverageWaitingTime * (newRoadTraffic[incomingRoadId] || 0) / 2,
        signalColor: isActive ? "#4ade80" : "#ef4444" // Green if active, red if not
      };
    }
  });
  
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
    nodeTrafficState: newNodeTrafficState,
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
        
        // Find the correct nodes for this edge
        const fromNode = trafficNodes.find(n => n.id === edge.from);
        const toNode = trafficNodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) continue;
        
        // Vehicles position from fromNode towards toNode
        const distanceRatio = scaledDistance / edge.length;
        const x = fromNode.x + (toNode.x - fromNode.x) * distanceRatio;
        const y = fromNode.y + (toNode.y - fromNode.y) * distanceRatio;
        
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
