
import { SimulationState, SimulationSettings, Vehicle, TrafficLightPhase } from "../types/simulation";

// Define traffic light phases
const trafficLightPhases: TrafficLightPhase[] = [
  { id: 0, name: "Green", duration: 82, color: "#4ade80" },
  { id: 1, name: "Yellow", duration: 3, color: "#facc15" },
  { id: 2, name: "Red", duration: 5, color: "#ef4444" },
];

// Initial Q-values for each state-action pair
const initialQValues: Record<string, number> = {};
const states = ["low_traffic", "medium_traffic", "high_traffic"];
const actions = [0, 1, 2]; // Traffic light phases

// Initialize Q-values
states.forEach((state) => {
  actions.forEach((action) => {
    initialQValues[`${state}_${action}`] = 0;
  });
});

// Initial simulation state
const initialSimulationState: SimulationState = {
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
};

/**
 * Determines the current traffic state based on vehicle count
 */
const determineTrafficState = (vehicleCount: number): string => {
  if (vehicleCount < 5) return "low_traffic";
  if (vehicleCount < 15) return "medium_traffic";
  return "high_traffic";
};

/**
 * Calculates reward based on average waiting time and speed
 */
const calculateReward = (averageWaitingTime: number, averageSpeed: number): number => {
  // Lower waiting time and higher speed mean better performance (higher reward)
  return -averageWaitingTime + averageSpeed * 2;
};

/**
 * Selects an action (traffic light phase) using epsilon-greedy strategy
 */
const selectAction = (
  state: string,
  qValues: Record<string, number>,
  epsilon: number
): number => {
  // Exploration: random action
  if (Math.random() < epsilon) {
    return Math.floor(Math.random() * 3);
  }
  
  // Exploitation: best action from Q-table
  let bestAction = 0;
  let bestValue = -Infinity;
  
  actions.forEach((action) => {
    const value = qValues[`${state}_${action}`];
    if (value > bestValue) {
      bestValue = value;
      bestAction = action;
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
  actions.forEach((nextAction) => {
    const value = qValues[`${nextState}_${nextAction}`];
    maxNextQ = Math.max(maxNextQ, value);
  });
  
  // Q-learning update formula
  const oldValue = qValues[`${state}_${action}`];
  const newQValues = { ...qValues };
  newQValues[`${state}_${action}`] = 
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
  // Generate random vehicles based on vehicle rate
  const newVehicleCount = Math.max(
    0,
    state.vehicleCount + 
    (Math.random() < settings.vehicleRate / 10 ? 1 : 0) -
    (Math.random() < 0.05 ? 1 : 0)
  );
  
  // Simulate vehicle movement and waiting time
  const newAverageWaitingTime = state.currentPhase === 2 
    ? state.averageWaitingTime + (newVehicleCount > 0 ? 0.5 : 0) 
    : Math.max(0, state.averageWaitingTime - (state.currentPhase === 0 ? 0.3 : 0));
  
  const newAverageSpeed = state.currentPhase === 0
    ? Math.min(13.9, state.averageSpeed + 0.2) 
    : Math.max(0, state.averageSpeed - (state.currentPhase === 2 ? 0.5 : 0.1));
  
  // Determine current traffic state
  const trafficState = determineTrafficState(newVehicleCount);
  
  // Calculate reward
  const reward = calculateReward(newAverageWaitingTime, newAverageSpeed);
  
  // Select action for the next state using Q-learning
  const nextAction = selectAction(trafficState, state.qValues, settings.epsilon);
  
  // Update Q-values
  const newQValues = updateQValue(
    trafficState,
    state.currentPhase,
    reward,
    trafficState,
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
  };
};

/**
 * Generates simulated vehicles for visualization
 */
const generateVehicles = (count: number, phase: number): Vehicle[] => {
  const vehicles: Vehicle[] = [];
  
  for (let i = 0; i < count; i++) {
    // Calculate position based on phase and random distribution
    const position: [number, number] = [
      Math.random() * 500,  // x coordinate along 500m road
      Math.random() < 0.1 ? 1 : 0  // y coordinate (lane)
    ];
    
    // Calculate speed based on traffic light phase
    const speed = phase === 0 ? 
      Math.random() * 10 + 3 : 
      phase === 1 ? 
        Math.random() * 5 + 1 : 
        0;
    
    // Calculate waiting time based on phase
    const waitingTime = phase === 2 ? 
      Math.random() * 5 : 
      phase === 1 ? 
        Math.random() * 2 : 
        0;
    
    vehicles.push({
      id: `v${i}`,
      position,
      speed,
      waitingTime,
    });
  }
  
  return vehicles;
};

export {
  initialSimulationState,
  trafficLightPhases,
  simulateStep,
  generateVehicles,
  determineTrafficState,
};
