
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vehicle, TrafficLightPhase, TrafficNode, TrafficEdge } from "@/types/simulation";
import { generateVehicles, trafficNodes, trafficEdges } from "@/services/simulationService";

interface TrafficVisualizationProps {
  vehicleCount: number;
  currentPhase: number;
  trafficPhases: TrafficLightPhase[];
  roadTraffic: Record<string, number>;
}

const TrafficVisualization = ({
  vehicleCount,
  currentPhase,
  trafficPhases,
  roadTraffic,
}: TrafficVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPhaseInfo = trafficPhases[currentPhase];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = "#f8fafc"; // slate-50
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw roads
    drawRoads(ctx, canvas.width, canvas.height);
    
    // Draw nodes
    trafficNodes.forEach(node => {
      drawNode(ctx, node);
    });

    // Draw traffic light at central node
    const centralNode = trafficNodes.find(node => node.id === "e");
    if (centralNode) {
      drawTrafficLight(ctx, centralNode.x, centralNode.y, currentPhaseInfo);
    }

    // Generate and draw vehicles
    const vehicles = generateVehicles(roadTraffic, currentPhase);
    vehicles.forEach((vehicle) => {
      drawVehicle(ctx, vehicle);
    });
  }, [vehicleCount, currentPhase, trafficPhases, roadTraffic]);

  const drawRoads = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw all edges (roads)
    trafficEdges.forEach(edge => {
      const fromNode = trafficNodes.find(n => n.id === edge.from);
      const toNode = trafficNodes.find(n => n.id === edge.to);
      
      if (!fromNode || !toNode) return;
      
      // Set road style
      ctx.strokeStyle = "#475569"; // slate-600
      ctx.lineWidth = 15;
      
      // Draw road
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();
      
      // Draw road markings
      ctx.strokeStyle = "#f8fafc"; // slate-50
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw road labels
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      
      ctx.fillStyle = "#cbd5e1"; // slate-300
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Offset the label a bit from the road
      const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x) + Math.PI / 2;
      const labelX = midX + Math.cos(angle) * 10;
      const labelY = midY + Math.sin(angle) * 10;
      
      ctx.fillText(edge.id, labelX, labelY);
    });
  };

  const drawTrafficLight = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    phaseInfo: TrafficLightPhase
  ) => {
    // Draw traffic light circles around the center
    const radius = 25;
    const centerX = x;
    const centerY = y;
    
    // Draw traffic light housing
    ctx.fillStyle = "#334155"; // slate-700
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw active roads indicator
    phaseInfo.activeRoads.forEach(roadId => {
      const edge = trafficEdges.find(e => e.id === roadId);
      if (!edge) return;
      
      const angleRad = (edge.angle * Math.PI) / 180;
      const lightX = centerX + Math.cos(angleRad) * (radius - 5);
      const lightY = centerY + Math.sin(angleRad) * (radius - 5);
      
      // Draw light
      ctx.fillStyle = phaseInfo.color;
      ctx.beginPath();
      ctx.arc(lightX, lightY, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Label for current phase
    ctx.fillStyle = "#f8fafc"; // slate-50
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(phaseInfo.name, centerX, centerY);
  };

  const drawNode = (
    ctx: CanvasRenderingContext2D,
    node: TrafficNode
  ) => {
    ctx.fillStyle = node.hasTrafficLight ? "#94a3b8" : "#cbd5e1"; // slate-400 or slate-300
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.hasTrafficLight ? 15 : 7, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#1e293b"; // slate-900
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.id, node.x, node.y);
  };

  const drawVehicle = (ctx: CanvasRenderingContext2D, vehicle: Vehicle) => {
    const [x, y] = vehicle.position;
    
    // Draw vehicle body
    ctx.fillStyle = "#3b82f6"; // blue-500
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Display waiting time indicator if applicable
    if (vehicle.waitingTime > 1) {
      ctx.fillStyle = "#ef4444"; // red-500
      ctx.beginPath();
      ctx.arc(x, y - 8, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Traffic Simulation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="bg-slate-100 p-2 rounded-lg">
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              className="w-full bg-slate-50 border border-slate-200 rounded"
            ></canvas>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded">
              <span>Current phase:</span>
              <span 
                className="px-2 py-1 rounded font-semibold" 
                style={{ backgroundColor: currentPhaseInfo.color, color: currentPhaseInfo.name.includes("Green") ? "black" : "white" }}
              >
                {currentPhaseInfo.name}
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded">
              <span>Vehicles:</span>
              <span className="font-semibold">{vehicleCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficVisualization;
