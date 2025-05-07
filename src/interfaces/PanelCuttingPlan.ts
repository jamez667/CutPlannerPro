import { PanelPiece } from './PanelPiece';
import { PanelStock } from './PanelStock';

export interface PanelCuttingPlanStockItem {
  stock: PanelStock;
  priority: number;
}

export interface CutPlacement {
  pieceId: string;
  x: number;
  y: number;
  rotated: boolean;
}

export interface PanelCuttingPlanLayout {
  stockId: number;
  stockInstanceId?: string; // Unique ID for this specific sheet instance
  sheetIndex?: number;      // Index of this sheet among multiple of the same stock type
  placements: CutPlacement[];
  wastePercentage: number;
}

export interface PanelCuttingPlan {
  id: number;
  name: string;
  createdDate: Date;
  updatedDate: Date;
  selectedStock: PanelCuttingPlanStockItem[];
  requiredPieces: PanelPiece[];
  expandedPieces?: PanelPiece[];    // Store the expanded pieces
  unplacedPieceIds?: string[];      // Store IDs of pieces that couldn't be placed
  layouts: PanelCuttingPlanLayout[];
  wastagePercentage: number;
  notes: string;
  kerfSize?: number;                // Kerf size for the plan
}