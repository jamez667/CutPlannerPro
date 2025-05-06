import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Autocomplete,
} from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { PanelStockFormData } from '../interfaces/PanelStockFormData';
import { formatDimensionValue } from '../utils/formatters';
import { convertFromMetric } from '../utils/unitConversion'; // Import conversion function

const filter = createFilterOptions<string>();

const getPresets = (units: string) => {
  console.log('getPresets called with units:', units);
  const metricPresets = {
    lengths: [2440, 2800, 3050],
    widths: [1220, 1525, 1830],
    thicknesses: [3, 6, 9, 12, 15, 16, 18, 19, 22, 25, 30, 32, 38]
  };
  const imperialPresets = {
    lengths: [48, 60, 72, 96, 120],
    widths: [24, 30, 48, 60],
    thicknesses: [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 1, 1.25, 1.5]
  };
  return units === 'in' ? imperialPresets : metricPresets;
};

interface AddPanelDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PanelStockFormData) => void;
  editingId: number | null;
  initialData: PanelStockFormData;
  units: string;
  woodSpeciesOptions: string[];
  setWoodSpeciesOptions: (species: string[]) => void;
}

const AddPanelDialog: React.FC<AddPanelDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editingId,
  initialData,
  units,
  woodSpeciesOptions,
  setWoodSpeciesOptions,
}) => {
  const [formData, setFormData] = React.useState<PanelStockFormData>(initialData);

  React.useEffect(() => {
    // Only convert dimension values if displaying in inches (data is stored as mm)
    if (units === 'in') {
      setFormData({
        ...initialData,
        length: convertFromMetric(initialData.length || 0, 'in'),
        width: convertFromMetric(initialData.width || 0, 'in'),
        thickness: convertFromMetric(initialData.thickness || 0, 'in'),
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

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleDimensionChange = (dimension: 'length' | 'width' | 'thickness') => 
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
          {editingId !== null ? 'Edit Panel Stock' : 'Add Panel Stock'}
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
                  {formatDimensionValue(option, 'length', units, false)}
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
            <Autocomplete
              value={formData.width || null}
              onChange={handleDimensionChange('width')}
              options={currentPresets.widths}
              getOptionLabel={(option) => option?.toString() || ''}
              renderOption={(props, option) => (
                <li {...props}>
                  {formatDimensionValue(option, 'width', units, false)}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Width (${units === 'mm' ? 'mm' : 'in'})`}
                  type="number"
                  required
                />
              )}
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
            />
            <Autocomplete
              value={formData.thickness || null}
              onChange={handleDimensionChange('thickness')}
              options={currentPresets.thicknesses}
              getOptionLabel={(option) => option?.toString() || ''}
              renderOption={(props, option) => (
                <li {...props}>
                  {formatDimensionValue(option, 'thickness', units, false)}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Thickness (${units === 'mm' ? 'mm' : 'in'})`}
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
            <FormControl>
              <InputLabel>Grain Direction</InputLabel>
              <Select
                name="grainDirection"
                value={formData.grainDirection}
                label="Grain Direction"
                onChange={handleSelectChange}
                required
              >
                <MenuItem value="Lengthwise">Length</MenuItem>
                <MenuItem value="Widthwise">Width</MenuItem>
                <MenuItem value="N/A">N/A</MenuItem>
              </Select>
            </FormControl>
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

export default AddPanelDialog;