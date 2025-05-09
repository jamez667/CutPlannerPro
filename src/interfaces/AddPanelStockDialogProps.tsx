import { PanelStockFormData } from '../interfaces/PanelStockFormData';

export interface AddPanelStockDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PanelStockFormData) => void;
  editingId: number | null;
  initialData: PanelStockFormData;
  units: string;
  woodSpeciesOptions: string[];
  setWoodSpeciesOptions: (species: string[]) => void;
}
