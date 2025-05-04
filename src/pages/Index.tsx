
import SimulationDashboard from "@/components/SimulationDashboard";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SimulationDashboard />
      
      <footer className="py-6 text-center text-sm text-slate-500">
        <p>Traffic Simulation with Q-Learning Reinforcement Learning Algorithm</p>
        <p className="text-xs mt-1">
          Four-way junction with adaptive traffic management using reinforcement learning
        </p>
      </footer>
    </div>
  );
};

export default Index;
