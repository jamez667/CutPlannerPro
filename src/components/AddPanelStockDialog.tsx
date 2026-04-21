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
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TransitionProps } from '@mui/material/transitions';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { PanelStockFormData } from '../interfaces/PanelStockFormData';
import { Dimension } from "../enums/Dimension";
import { convertFromMetric, convertToMetric } from '../utils/unitConversion'; // Import conversion function
import { getPresets } from '../utils/getPresets';
import PresetDimensionDropdown from './PresetDimensionDropdown';
import { AddPanelStockDialogProps } from '../interfaces/AddPanelStockDialogProps';

const filter = createFilterOptions<string>();

// Transition component for mobile modal
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddPanelDialog: React.FC<AddPanelStockDialogProps> = ({
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  React.useEffect(() => {
    // Only convert dimension values if displaying in inches (data is stored as mm)
    if (units === 'in') {
      setFormData({
        ...initialData,
        length: convertFromMetric(initialData.length || 0, units),
        width: convertFromMetric(initialData.width || 0, units),
        thickness: convertFromMetric(initialData.thickness || 0, units),
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

  const handleDimensionChange = (dimension: Dimension) => 
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

  // Mobile-specific close handler
  const handleMobileClose = () => {
    onClose();
  };

  // Mobile Dialog Content
  const MobileDialogContent = () => (
    <>      <AppBar position="relative" sx={{ bgcolor: 'primary.main', zIndex: 1300 }}>
        <Toolbar sx={{ minHeight: 64 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleMobileClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            {editingId !== null ? 'Edit Panel Stock' : 'Add Panel Stock'}
          </Typography>
          <Button 
            autoFocus 
            color="inherit" 
            onClick={handleFormSubmit}
            type="submit"
            form="panel-stock-form"
            variant="outlined"
            sx={{ 
              borderColor: 'white', 
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            {editingId !== null ? 'Save' : 'Add'}
          </Button>
        </Toolbar>      </AppBar>      <Box sx={{
        p: 2,
        pb: 10, // Space for bottom action bar
        height: 'calc(100vh - 64px - 80px)', // Total height minus AppBar and bottom bar
        maxHeight: 'calc(100vh - 64px - 80px)',
        overflow: 'auto',
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box'
      }}>
        <Box sx={{ 
          display: 'grid',
          gap: 2, // Default gap restored
          pt: 1,
          width: '100%',
          maxWidth: 'calc(100vw - 32px)', // Account for default padding
          boxSizing: 'border-box',
          overflow: 'hidden',
          '& .MuiFormControl-root': {
            width: '100%',
            minWidth: 0,
            maxWidth: '100%'
          },
          '& .MuiAutocomplete-root': {
            width: '100%',
            minWidth: 0,
            maxWidth: '100%'
          },
          '& .MuiTextField-root': {
            width: '100%',
            minWidth: 0,
            maxWidth: '100%'
          }
        }}>
          <PresetDimensionDropdown
            value={formData.length ? convertFromMetric(formData.length, units) : null}
            onChange={handleDimensionChange(Dimension.LENGTH)}
            options={currentPresets.lengths}
            dimension={Dimension.LENGTH}
            units={units}
            label="Length"
            required
            fullWidth
          />
          
          <PresetDimensionDropdown
            value={formData.width ? convertFromMetric(formData.width, units) : null}
            onChange={handleDimensionChange(Dimension.WIDTH)} 
            options={currentPresets.widths}
            dimension={Dimension.WIDTH}
            units={units}
            label="Width"
            required
            fullWidth
          />
          
          <PresetDimensionDropdown
            value={formData.thickness ? convertFromMetric(formData.thickness, units) : null}
            onChange={handleDimensionChange(Dimension.THICKNESS)}
            options={currentPresets.thicknesses}
            dimension={Dimension.THICKNESS}
            units={units}
            label="Thickness"
            required
            fullWidth
          />          <TextField
            name="quantity"
            label="Quantity"
            type="number"
            value={formData.quantity || ''}
            onChange={handleTextInputChange}
            required
            inputProps={{ min: 1 }}
            fullWidth
          />
          
          <FormControl fullWidth>
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
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label="Wood Species"
                required
              />
            )}
          />
            <TextField            name="description"
            label="Description"
            value={formData.description}
            onChange={handleTextInputChange}
            fullWidth
            multiline
            rows={2}
          />
          
          <TextField
            name="pricePer"
            label="Price Per"
            type="number"
            value={formData.pricePer || ''}
            onChange={handleTextInputChange}
            required
            fullWidth
          /></Box>
      </Box>        {/* Bottom Action Bar for guaranteed button visibility */}
      <Box sx={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100vw',
        maxWidth: '100vw',        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        p: 1.5, // Default padding restored
        display: 'flex',
        gap: 1.5, // Default gap restored
        zIndex: 1300,
        boxSizing: 'border-box'
      }}>        <Button
          variant="outlined"
          onClick={handleMobileClose}
          sx={{ 
            flex: 1,
            minWidth: 0,
            maxWidth: 'calc(50vw - 12px)', // Account for increased gap
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleFormSubmit}
          type="submit"
          form="panel-stock-form"
          sx={{ 
            flex: 1,
            minWidth: 0,
            maxWidth: 'calc(50vw - 12px)', // Account for increased gap
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {editingId !== null ? 'Save' : 'Add'}
        </Button>
      </Box>
    </>
  );

  // Desktop Dialog Content
  const DesktopDialogContent = () => (
    <form onSubmit={handleFormSubmit}>
      <DialogTitle>
        {editingId !== null ? 'Edit Panel Stock' : 'Add Panel Stock'}
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
          
          <PresetDimensionDropdown
            value={formData.width ? convertFromMetric(formData.width, units) : null}
            onChange={handleDimensionChange(Dimension.WIDTH)} 
            options={currentPresets.widths}
            dimension={Dimension.WIDTH}
            units={units}
            label="Width"
            required
          />
          
          <PresetDimensionDropdown
            value={formData.thickness ? convertFromMetric(formData.thickness, units) : null}
            onChange={handleDimensionChange(Dimension.THICKNESS)}
            options={currentPresets.thicknesses}
            dimension={Dimension.THICKNESS}
            units={units}
            label="Thickness"
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
  );  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={isMobile ? false : "sm"}
      fullWidth={!isMobile}
      fullScreen={isMobile}
      TransitionComponent={isMobile ? Transition : undefined}
      PaperProps={{
        sx: isMobile ? {
          m: 0,
          borderRadius: 0,
        } : {
          m: 1,
          width: '100%',
          maxWidth: 420,
          borderRadius: 2,
          boxShadow: 6,
        }
      }}
    >
      {isMobile ? (
        <form id="panel-stock-form" onSubmit={handleFormSubmit}>
          <MobileDialogContent />
        </form>
      ) : (
        <DesktopDialogContent />
      )}
    </Dialog>
  );
};

export default AddPanelDialog;