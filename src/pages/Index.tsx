
import SimulationDashboard from "@/components/SimulationDashboard";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SimulationDashboard />
      
      <footer className="py-6 text-center text-sm text-slate-500">
        <p>SUMO Traffic Simulation with Q-Learning Reinforcement Learning Algorithm</p>
        <p className="text-xs mt-1">
          Based on Simulation of Urban MObility (SUMO) traffic simulation package
        </p>
      </footer>
    </div>
  );
};

export default Index;
