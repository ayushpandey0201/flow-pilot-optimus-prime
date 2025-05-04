
export interface SimulationState {
  isRunning: boolean;
  step: number;
  averageWaitingTime: number;
  averageSpeed: number;
  vehicleCount: number;
  qValues: Record<string, number>;
  currentPhase: number;
  currentReward: number;
  epsilon: number;
  learningRate: number;
  discountFactor: number;
  roadTraffic: Record<string, number>; // Traffic on each road (vehicles per road)
  nodeTrafficState: Record<string, NodeTrafficState>; // Traffic state at each node
  adaptiveMode: boolean; // Whether to use the adaptive Q-learning mode
}

export interface NodeTrafficState {
  vehicleCount: number; // Number of vehicles at this node
  waitingTime: number; // Average waiting time at this node
  signalColor: string; // Current signal color at this node
}

export interface TrafficLightPhase {
  id: number;
  name: string;
  duration: number;
  color: string;
  activeRoads: string[]; // Roads that have green light in this phase
}

export interface SimulationSettings {
  maxSteps: number;
  vehicleRate: number;
  learningRate: number;
  epsilon: number;
  discountFactor: number;
  adaptiveMode: boolean; // Enable/disable adaptive learning
}

export interface TrafficNode {
  id: string;
  x: number;
  y: number;
  hasTrafficLight: boolean;
}

export interface TrafficEdge {
  id: string;
  from: string;
  to: string;
  length: number;
  angle: number; // Angle in degrees
}

export interface Vehicle {
  id: string;
  position: [number, number];
  speed: number;
  waitingTime: number;
  roadId: string; // The road the vehicle is on
}
