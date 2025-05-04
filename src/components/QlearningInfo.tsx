
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulationState } from "@/types/simulation";
import { determineTrafficState } from "@/services/simulationService";

interface QlearningInfoProps {
  simulationState: SimulationState;
}

const QlearningInfo = ({ simulationState }: QlearningInfoProps) => {
  const { 
    qValues, 
    currentPhase, 
    vehicleCount, 
    currentReward, 
    epsilon, 
    learningRate, 
    discountFactor 
  } = simulationState;

  const currentState = determineTrafficState(vehicleCount);
  
  // Get Q-values for current state
  const stateQValues = [
    qValues[`${currentState}_0`] || 0,
    qValues[`${currentState}_1`] || 0,
    qValues[`${currentState}_2`] || 0,
  ];

  // Find the best action for current state
  const bestActionIndex = stateQValues.indexOf(Math.max(...stateQValues));
  
  // Get action names
  const actionNames = ["Green", "Yellow", "Red"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Q-Learning Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <InfoItem label="Current state" value={currentState.replace("_", " ")} />
            <InfoItem label="Current action" value={actionNames[currentPhase]} />
            <InfoItem label="Current reward" value={currentReward.toFixed(2)} />
            <InfoItem label="Best action" value={actionNames[bestActionIndex]} />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Q-values for current state:</h4>
            <div className="grid grid-cols-3 gap-2">
              {stateQValues.map((value, i) => (
                <div 
                  key={`q-${i}`}
                  className={`p-2 rounded text-center ${
                    i === bestActionIndex ? "bg-blue-100 border border-blue-300" : "bg-slate-100"
                  }`}
                >
                  <div className="text-xs text-slate-500 mb-1">{actionNames[i]}</div>
                  <div className="font-semibold">{value.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Hyperparameters:</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-slate-100 p-2 rounded">
                <div className="text-xs text-slate-500 mb-1">Epsilon (ε)</div>
                <div className="font-semibold">{epsilon.toFixed(2)}</div>
              </div>
              <div className="bg-slate-100 p-2 rounded">
                <div className="text-xs text-slate-500 mb-1">Learning rate (α)</div>
                <div className="font-semibold">{learningRate.toFixed(2)}</div>
              </div>
              <div className="bg-slate-100 p-2 rounded">
                <div className="text-xs text-slate-500 mb-1">Discount factor (γ)</div>
                <div className="font-semibold">{discountFactor.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col bg-slate-100 p-2 rounded">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="font-semibold capitalize">{value}</span>
  </div>
);

export default QlearningInfo;
