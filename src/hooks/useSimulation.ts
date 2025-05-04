
import { useState, useEffect, useCallback, useRef } from "react";
import { SimulationState, SimulationSettings } from "../types/simulation";
import { initialSimulationState, simulateStep } from "../services/simulationService";

const defaultSettings: SimulationSettings = {
  maxSteps: 1000,
  vehicleRate: 5,
  learningRate: 0.1,
  epsilon: 0.1,
  discountFactor: 0.9,
};

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(initialSimulationState);
  const [settings, setSettings] = useState<SimulationSettings>(defaultSettings);
  const simulationInterval = useRef<number | null>(null);

  const startSimulation = useCallback(() => {
    if (simulationInterval.current) return;
    
    setState((prev) => ({ ...prev, isRunning: true }));
    
    simulationInterval.current = window.setInterval(() => {
      setState((prevState) => {
        const newState = simulateStep(prevState, settings);
        
        // Stop simulation when max steps is reached
        if (newState.step >= settings.maxSteps) {
          stopSimulation();
        }
        
        return newState;
      });
    }, 300); // Update every 300ms
  }, [settings]);

  const stopSimulation = useCallback(() => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resetSimulation = useCallback(() => {
    stopSimulation();
    setState(initialSimulationState);
  }, [stopSimulation]);

  const updateSettings = useCallback((newSettings: Partial<SimulationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, []);

  return {
    state,
    settings,
    startSimulation,
    stopSimulation,
    resetSimulation,
    updateSettings,
  };
}
