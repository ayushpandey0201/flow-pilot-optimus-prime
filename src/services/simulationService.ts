import { SimulationState, SimulationSettings } from "../types/simulation";
import { trafficNodes, trafficEdges, trafficLightPhases } from "./trafficData";
import { createStateKey, createInitialQValues } from "./trafficUtils";
import { calculateReward, selectAction, updateQValue } from "./qLearningService";
import { generateVehicles } from "./vehicleService";

// Initial simulation state
export const initialSimulationState: SimulationState = {
  isRunning: false,
  step: 0,
  averageWaitingTime: 0,
  averageSpeed: 0,
  vehicleCount: 0,
  qValues: createInitialQValues(),
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
 * Simulates a step in the traffic simulation
 */
export const simulateStep = (
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

// Make sure to export everything needed
export { trafficNodes, trafficEdges, trafficLightPhases, generateVehicles, createStateKey, simulateStep };
