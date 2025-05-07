import { PanelCuttingPlanLayout } from '../interfaces/PanelCuttingPlan';
import { PanelPiece } from '../interfaces/PanelPiece';
import { PanelStock } from '../interfaces/PanelStock';

export interface PanelCuttingVisualizerProps {
  stock: PanelStock;
  pieces: PanelPiece[];
  layout: PanelCuttingPlanLayout;
  unit: string;
  kerfSize?: number; // Make kerfSize optional with a default value
}
