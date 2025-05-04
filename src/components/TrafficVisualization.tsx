
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vehicle, TrafficLightPhase } from "@/types/simulation";
import { generateVehicles } from "@/services/simulationService";

interface TrafficVisualizationProps {
  vehicleCount: number;
  currentPhase: number;
  trafficPhases: TrafficLightPhase[];
}

const TrafficVisualization = ({
  vehicleCount,
  currentPhase,
  trafficPhases,
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

    // Draw road
    ctx.fillStyle = "#475569"; // slate-600
    ctx.fillRect(0, 70, canvas.width, 60);

    // Draw road markings
    ctx.strokeStyle = "#f8fafc"; // slate-50
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(0, 100);
    ctx.lineTo(canvas.width, 100);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw traffic light
    const trafficLightX = canvas.width - 100;
    drawTrafficLight(ctx, trafficLightX, 60, currentPhaseInfo.color);

    // Draw nodes
    drawNode(ctx, 50, 100, "a");
    drawNode(ctx, canvas.width - 100, 100, "b");
    drawNode(ctx, canvas.width - 50, 100, "c");

    // Generate and draw vehicles
    const vehicles = generateVehicles(vehicleCount, currentPhase);
    vehicles.forEach((vehicle) => {
      drawVehicle(ctx, vehicle);
    });
  }, [vehicleCount, currentPhase, trafficPhases]);

  const drawTrafficLight = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string
  ) => {
    ctx.fillStyle = "#1e293b"; // slate-800
    ctx.fillRect(x - 5, y - 40, 10, 40);
    
    // Traffic light housing
    ctx.fillStyle = "#334155"; // slate-700
    ctx.fillRect(x - 10, y - 55, 20, 30);
    
    // Light
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - 40, 7, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawNode = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string
  ) => {
    ctx.fillStyle = "#94a3b8"; // slate-400
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "#f8fafc"; // slate-50
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y);
  };

  const drawVehicle = (ctx: CanvasRenderingContext2D, vehicle: Vehicle) => {
    const [x, y] = vehicle.position;
    const scaledX = (x / 500) * (canvasRef.current?.width || 500);
    const laneY = y === 0 ? 80 : 120;
    
    ctx.fillStyle = "#3b82f6"; // blue-500
    
    // Vehicle body
    ctx.fillRect(scaledX, laneY - 5, 15, 10);
    
    // Display waiting time indicator if applicable
    if (vehicle.waitingTime > 0) {
      ctx.fillStyle = "#ef4444"; // red-500
      ctx.beginPath();
      ctx.arc(scaledX + 7.5, laneY - 10, 3, 0, Math.PI * 2);
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
              width={550}
              height={200}
              className="w-full bg-slate-50 border border-slate-200 rounded"
            ></canvas>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded">
              <span>Current phase:</span>
              <span 
                className="px-2 py-1 rounded font-semibold" 
                style={{ backgroundColor: currentPhaseInfo.color, color: currentPhaseInfo.name === "Green" ? "black" : "white" }}
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
