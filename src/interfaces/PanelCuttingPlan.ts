import { PanelCut } from './PanelCut';
import { PanelStock } from './PanelStock';

export interface PanelCuttingPlanLayout {
  stockId: number;
  cuts: Array<{
    cutId: number;
    x: number;
    y: number;
    rotated: boolean;
  }>;
}

export interface PanelCuttingPlan {
  id: number;
  name: string;
  createdDate: Date;
  updatedDate: Date;
  selectedStock: PanelStock[];
  requiredCuts: PanelCut[];
  layouts: PanelCuttingPlanLayout[];
  wastagePercentage: number;
  notes: string;
}