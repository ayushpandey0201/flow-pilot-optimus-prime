
import { Vehicle } from "../types/simulation";
import { trafficEdges, trafficNodes, trafficLightPhases } from "./trafficData";

/**
 * Generates simulated vehicles for visualization
 */
export const generateVehicles = (roadTraffic: Record<string, number>, currentPhase: number): Vehicle[] => {
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
