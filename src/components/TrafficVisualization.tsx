
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vehicle, TrafficLightPhase, TrafficNode, TrafficEdge, NodeTrafficState } from "@/types/simulation";
import { generateVehicles } from "@/services/vehicleService";
import { trafficNodes, trafficEdges } from "@/services/trafficData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TrafficVisualizationProps {
  vehicleCount: number;
  currentPhase: number;
  trafficPhases: TrafficLightPhase[];
  roadTraffic: Record<string, number>;
  nodeTrafficState: Record<string, NodeTrafficState>;
}

const TrafficVisualization = ({
  vehicleCount,
  currentPhase,
  trafficPhases,
  roadTraffic,
  nodeTrafficState,
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
      const nodeState = nodeTrafficState[node.id];
      drawNode(ctx, node, nodeState);
    });

    // Generate and draw vehicles
    const vehicles = generateVehicles(roadTraffic, currentPhase);
    vehicles.forEach((vehicle) => {
      drawVehicle(ctx, vehicle);
    });
  }, [vehicleCount, currentPhase, trafficPhases, roadTraffic, nodeTrafficState]);

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

  const drawNode = (
    ctx: CanvasRenderingContext2D,
    node: TrafficNode,
    nodeState: NodeTrafficState
  ) => {
    // Draw node circle
    ctx.fillStyle = node.hasTrafficLight ? "#94a3b8" : "#cbd5e1"; // slate-400 or slate-300
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.hasTrafficLight ? 15 : 7, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw node ID
    ctx.fillStyle = "#1e293b"; // slate-900
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(node.id, node.x, node.y);
    
    // If this node has a traffic light, draw a colored circle indicating the signal
    if (node.hasTrafficLight) {
      ctx.fillStyle = nodeState.signalColor;
      ctx.beginPath();
      ctx.arc(node.x, node.y - 20, 5, 0, Math.PI * 2);
      ctx.fill();
    }
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
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Traffic Simulation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="bg-slate-100 p-2 rounded-lg">
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              className="w-full bg-slate-50 border border-slate-200 rounded"
            ></canvas>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded">
              <span>Current phase:</span>
              <span 
                className="px-2 py-1 rounded font-semibold" 
                style={{ backgroundColor: currentPhaseInfo.color, color: "#000000" }}
              >
                {currentPhaseInfo.name}
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded">
              <span>Total vehicles:</span>
              <span className="font-semibold">{vehicleCount}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Node Traffic States</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Node</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Waiting Time</TableHead>
                  <TableHead>Signal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(nodeTrafficState).map(([nodeId, state]) => (
                  <TableRow key={nodeId}>
                    <TableCell className="font-medium">{nodeId}</TableCell>
                    <TableCell>{state.vehicleCount}</TableCell>
                    <TableCell>{state.waitingTime.toFixed(1)}s</TableCell>
                    <TableCell>
                      <div 
                        className="w-4 h-4 rounded-full inline-block"
                        style={{ backgroundColor: state.signalColor }} 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrafficVisualization;
