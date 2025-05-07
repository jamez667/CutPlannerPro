import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Button,
  Autocomplete,
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { LinearStockFormData } from '../interfaces/LinearStockFormData';
import { formatDimensionValue } from '../utils/formatters';
import { convertFromMetric } from '../utils/unitConversion';

const filter = createFilterOptions<string>();

const getPresets = (units: string) => {
  const metricPresets = {
    lengths: [600, 1200, 1800, 2400, 3000, 3600],
  };
  const imperialPresets = {
    lengths: [24, 36, 48, 72, 96, 120, 144],
  };
  return units === 'in' ? imperialPresets : metricPresets;
};

interface AddLinearDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LinearStockFormData) => void;
  editingId: number | null;
  initialData: LinearStockFormData;
  units: string;
  woodSpeciesOptions: string[];
  setWoodSpeciesOptions: (species: string[]) => void;
}

const AddLinearDialog: React.FC<AddLinearDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editingId,
  initialData,
  units,
  woodSpeciesOptions,
  setWoodSpeciesOptions,
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

  const handleWoodSpeciesChange = (event: React.SyntheticEvent, newValue: string | null) => {
    if (newValue) {
      if (newValue.startsWith('Add "') && newValue.endsWith('"')) {
        const species = newValue.slice(5, -1);
        if (!woodSpeciesOptions.includes(species)) {
          setWoodSpeciesOptions([...woodSpeciesOptions, species]);
        }
        setFormData(prev => ({ ...prev, woodSpecies: species }));
      } else {
        setFormData(prev => ({ ...prev, woodSpecies: newValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, woodSpecies: '' }));
    }
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleFormSubmit}>
        <DialogTitle>
          {editingId !== null ? 'Edit Linear Stock' : 'Add Linear Stock'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
            <Autocomplete
              value={formData.length || null}
              onChange={handleDimensionChange('length')}
              options={currentPresets.lengths}
              getOptionLabel={(option) => option?.toString() || ''}
              renderOption={(props, option) => (
                <li {...props}>
                  {formatDimensionValue(option, 'length', units)}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Length (${units === 'mm' ? 'mm' : 'in'})`}
                  type="number"
                  required
                />
              )}
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
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
            <Autocomplete
              value={formData.woodSpecies}
              onChange={handleWoodSpeciesChange}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                const { inputValue } = params;
                const isExisting = options.some((option) => inputValue === option);
                if (inputValue !== '' && !isExisting) {
                  filtered.push(`Add "${inputValue}"`);
                }
                return filtered;
              }}
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              options={woodSpeciesOptions}
              renderOption={(props, option) => <li {...props}>{option}</li>}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Wood Species"
                  required
                />
              )}
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