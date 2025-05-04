
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimulationState } from "@/types/simulation";
import { createStateKey } from "@/services/simulationService";

interface QlearningInfoProps {
  simulationState: SimulationState;
}

const QlearningInfo = ({ simulationState }: QlearningInfoProps) => {
  const { 
    qValues, 
    currentPhase, 
    roadTraffic, 
    currentReward, 
    epsilon, 
    learningRate, 
    discountFactor,
    adaptiveMode
  } = simulationState;

  const currentState = createStateKey(roadTraffic);
  
  // Get Q-values for current state
  const stateQValues = Array.from({ length: 2 }, (_, i) => 
    qValues[`${currentState}_${i}`] || 0
  );

  // Find the best action for current state
  const bestActionIndex = stateQValues.indexOf(Math.max(...stateQValues));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Q-Learning Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <InfoItem label="Current reward" value={currentReward.toFixed(2)} />
            <InfoItem 
              label="Learning mode" 
              value={adaptiveMode ? "Adaptive" : "Pure Q-Learning"} 
            />
            <InfoItem 
              label="Current phase" 
              value={currentPhase === 0 ? "East-West Green" : "North-South Green"} 
            />
            <InfoItem 
              label="Best phase" 
              value={bestActionIndex === 0 ? "East-West Green" : "North-South Green"} 
            />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Road Traffic:</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(roadTraffic)
                .filter(([id]) => !id.includes("_out"))
                .map(([id, traffic]) => (
                <div 
                  key={id}
                  className={`p-2 rounded text-center ${
                    (id === "road_west" || id === "road_east") && currentPhase === 0 || 
                    (id === "road_north" || id === "road_south") && currentPhase === 1
                      ? "bg-green-100 border border-green-300" 
                      : "bg-slate-100"
                  }`}
                >
                  <div className="text-xs text-slate-500 mb-1">{id.replace("road_", "")}</div>
                  <div className="font-semibold">{traffic}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Q-values for current state:</h4>
            <div className="grid grid-cols-2 gap-2">
              {stateQValues.map((value, i) => (
                <div 
                  key={`q-${i}`}
                  className={`p-2 rounded text-center ${
                    i === bestActionIndex ? "bg-blue-100 border border-blue-300" : "bg-slate-100"
                  }`}
                >
                  <div className="text-xs text-slate-500 mb-1">
                    {i === 0 ? "East-West Green" : "North-South Green"}
                  </div>
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
