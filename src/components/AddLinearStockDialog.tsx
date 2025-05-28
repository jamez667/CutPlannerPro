import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Button,
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { LinearStockFormData } from '../interfaces/LinearStockFormData';
import { Dimension } from "../enums/Dimension";
import { convertFromMetric } from '../utils/unitConversion';
import { AddLinearStockDialogProps } from '../interfaces/AddLinearStockDialogProps';
import { getPresets } from '../utils/getPresets';
import PresetDimensionDropdown from './PresetDimensionDropdown';

const filter = createFilterOptions<string>();

const AddLinearDialog: React.FC<AddLinearStockDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editingId,
  initialData,
  units
}) => {
  const [formData, setFormData] = React.useState<LinearStockFormData>(initialData);

  React.useEffect(() => {
    // Only convert dimension values if displaying in inches (data is stored as mm)
    if (units === 'in') {
      setFormData({
        ...initialData,
        length: convertFromMetric(initialData.length || 0, 'in'),
      });
    } else {
      setFormData(initialData);
    }
  }, [initialData, units]);

  const currentPresets = getPresets(units);

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? Number(value) : value
    }));
  };
  const handleDimensionChange = (dimension: 'length') => 
    (event: React.SyntheticEvent, newValue: number | string | null) => {
      if (newValue !== null) {
        const numberValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
        if (!isNaN(numberValue)) {
          // When selecting from presets, the values are already in the correct units
          // No need for additional conversion
          setFormData(prev => ({ ...prev, [dimension]: numberValue }));
        }
      } else {
        setFormData(prev => ({ ...prev, [dimension]: '' as unknown as number }));
      }
    };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          m: 1,
          width: '100%',
          maxWidth: 420,
          borderRadius: 2,
          boxShadow: 6,
          '@media (max-width:600px)': {
            m: 0,
            maxWidth: '100vw',
            minHeight: '100vh',
            borderRadius: 0,
          },
        }
      }}
    >
      <form onSubmit={handleFormSubmit}>
        <DialogTitle>
          {editingId !== null ? 'Edit Linear Stock' : 'Add Linear Stock'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <PresetDimensionDropdown
              value={formData.length ? convertFromMetric(formData.length, units) : null}
              onChange={handleDimensionChange(Dimension.LENGTH)}
              options={currentPresets.lengths}
              dimension={Dimension.LENGTH}
              units={units}
              label="Length"
              required
            />
            <TextField
              name="quantity"
              label="Quantity"
              type="number"
              value={formData.quantity || ''}
              onChange={handleTextInputChange}
              required
              inputProps={{ min: 1 }}
            />
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleTextInputChange}
              required
            />
            <TextField
              name="pricePer"
              label="Price Per"
              type="number"
              value={formData.pricePer || ''}
              onChange={handleTextInputChange}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {editingId !== null ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddLinearDialog;