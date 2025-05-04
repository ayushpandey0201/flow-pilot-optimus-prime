
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
}

export interface TrafficLightPhase {
  id: number;
  name: string;
  duration: number;
  color: string;
}

export interface SimulationSettings {
  maxSteps: number;
  vehicleRate: number;
  learningRate: number;
  epsilon: number;
  discountFactor: number;
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
}

export interface Vehicle {
  id: string;
  position: [number, number];
  speed: number;
  waitingTime: number;
}
