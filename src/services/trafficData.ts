
import { TrafficNode, TrafficEdge, TrafficLightPhase } from "../types/simulation";

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
