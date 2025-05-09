import { LinearStockFormData } from './LinearStockFormData';


export interface AddLinearStockDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LinearStockFormData) => void;
  editingId: number | null;
  initialData: LinearStockFormData;
  units: string;
  woodSpeciesOptions: string[];
  setWoodSpeciesOptions: (species: string[]) => void;
}
