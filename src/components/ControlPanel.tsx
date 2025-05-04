
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { SimulationSettings } from "@/types/simulation";
import { Play, Pause, RotateCcw } from "lucide-react";

interface ControlPanelProps {
  isRunning: boolean;
  step: number;
  settings: SimulationSettings;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSettingsChange: (settings: Partial<SimulationSettings>) => void;
}

const ControlPanel = ({
  isRunning,
  step,
  settings,
  onStart,
  onStop,
  onReset,
  onSettingsChange,
}: ControlPanelProps) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">Control Panel</span>
          <span className="text-sm font-normal">
            Step: <span className="font-bold">{step}</span>
            {settings.maxSteps > 0 && (
              <span> / {settings.maxSteps}</span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            {!isRunning ? (
              <Button 
                onClick={onStart} 
                className="flex-1"
                variant="default"
              >
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            ) : (
              <Button 
                onClick={onStop} 
                className="flex-1"
                variant="secondary"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            <Button 
              onClick={onReset} 
              variant="outline"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Vehicle Rate: {settings.vehicleRate}</span>
              </div>
              <Slider
                value={[settings.vehicleRate]}
                min={1}
                max={10}
                step={1}
                onValueChange={(value) => onSettingsChange({ vehicleRate: value[0] })}
                disabled={isRunning}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Learning Rate (α): {settings.learningRate.toFixed(2)}</span>
              </div>
              <Slider
                value={[settings.learningRate * 100]}
                min={1}
                max={100}
                step={1}
                onValueChange={(value) => onSettingsChange({ learningRate: value[0] / 100 })}
                disabled={isRunning}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Epsilon (ε): {settings.epsilon.toFixed(2)}</span>
              </div>
              <Slider
                value={[settings.epsilon * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => onSettingsChange({ epsilon: value[0] / 100 })}
                disabled={isRunning}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Discount Factor (γ): {settings.discountFactor.toFixed(2)}</span>
              </div>
              <Slider
                value={[settings.discountFactor * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => onSettingsChange({ discountFactor: value[0] / 100 })}
                disabled={isRunning}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Max Steps: {settings.maxSteps}</span>
              </div>
              <Slider
                value={[settings.maxSteps]}
                min={100}
                max={5000}
                step={100}
                onValueChange={(value) => onSettingsChange({ maxSteps: value[0] })}
                disabled={isRunning}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
