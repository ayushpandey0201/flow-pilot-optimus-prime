
import { useSimulation } from "@/hooks/useSimulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trafficLightPhases } from "@/services/simulationService";
import TrafficVisualization from "./TrafficVisualization";
import QlearningInfo from "./QlearningInfo";
import ControlPanel from "./ControlPanel";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useRef, useState } from "react";

const SimulationDashboard = () => {
  const { state, settings, startSimulation, stopSimulation, resetSimulation, updateSettings } = useSimulation();
  const [metrics, setMetrics] = useState<Array<{ step: number, waitingTime: number, speed: number, reward: number }>>([]);
  const previousStep = useRef(0);

  // Update metrics data for charts
  useEffect(() => {
    if (state.step > previousStep.current) {
      setMetrics(prev => {
        const newMetrics = [...prev];
        newMetrics.push({
          step: state.step,
          waitingTime: state.averageWaitingTime,
          speed: state.averageSpeed,
          reward: state.currentReward
        });
        
        // Keep only the last 50 data points
        if (newMetrics.length > 50) {
          return newMetrics.slice(newMetrics.length - 50);
        }
        return newMetrics;
      });
      previousStep.current = state.step;
    }
  }, [state.step, state.averageWaitingTime, state.averageSpeed, state.currentReward]);

  return (
    <div className="container mx-auto py-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">SUMO Traffic Simulation with Q-Learning</h1>
        <p className="text-muted-foreground">
          Circular Junction with 6 Roads Using Reinforcement Learning
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <TrafficVisualization 
          vehicleCount={state.vehicleCount}
          currentPhase={state.currentPhase}
          trafficPhases={trafficLightPhases}
          roadTraffic={state.roadTraffic}
        />
        
        <QlearningInfo simulationState={state} />
        
        <ControlPanel
          isRunning={state.isRunning}
          step={state.step}
          settings={settings}
          onStart={startSimulation}
          onStop={stopSimulation}
          onReset={resetSimulation}
          onSettingsChange={updateSettings}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Traffic Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={metrics}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="waitingTime" 
                    name="Waiting Time" 
                    stroke="#ef4444" 
                    fill="#fecaca" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="speed" 
                    name="Speed" 
                    stroke="#3b82f6" 
                    fill="#bfdbfe" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Learning Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={metrics}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="reward" 
                    name="Reward" 
                    stroke="#10b981" 
                    fill="#d1fae5" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimulationDashboard;
