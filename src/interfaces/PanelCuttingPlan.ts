import { PanelPiece } from './PanelPiece';
import { PanelStock } from './PanelStock';

export interface PanelCuttingPlanStockItem {
  stock: PanelStock;
  priority: number;
}

export interface CutPlacement {
  cutId: number;
  x: number;
  y: number;
  rotated: boolean;
}

export interface PanelCuttingPlanLayout {
  stockId: number;
  placements: CutPlacement[];
  wastePercentage: number;
}

export interface PanelCuttingPlan {
  id: number;
  name: string;
  createdDate: Date;
  updatedDate: Date;
  selectedStock: PanelCuttingPlanStockItem[];
  requiredCuts: PanelPiece[];
  layouts: PanelCuttingPlanLayout[];
  wastagePercentage: number;
  notes: string;
}