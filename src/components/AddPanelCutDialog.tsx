import React, { useState } from 'react';
import { 
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, FormControl, InputLabel, Select, MenuItem,
  FormHelperText
} from '@mui/material';
import { PanelCut } from '../interfaces/PanelCut';

interface AddPanelCutDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (cut: PanelCut) => void;
  unit: string;
  nextId: number;
}

const AddPanelCutDialog: React.FC<AddPanelCutDialogProps> = ({ 
  open, onClose, onAdd, unit, nextId 
}) => {
  const [name, setName] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [grain, setGrain] = useState<'Lengthwise' | 'Widthwise' | 'N/A'>('N/A');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    length?: string;
    width?: string;
    quantity?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      name?: string;
      length?: string;
      width?: string;
      quantity?: string;
    } = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!length.trim() || isNaN(Number(length)) || Number(length) <= 0) {
      newErrors.length = 'Enter valid length';
    }
    if (!width.trim() || isNaN(Number(width)) || Number(width) <= 0) {
      newErrors.width = 'Enter valid width';
    }
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0 || !Number.isInteger(Number(quantity))) {
      newErrors.quantity = 'Enter valid quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const newCut: PanelCut = {
        id: nextId,
        name: name.trim(),
        length: Number(length),
        width: Number(width),
        quantity: Number(quantity),
        grain,
        notes: notes.trim()
      };
      onAdd(newCut);
      handleClose();
    }
  };

  const handleClose = () => {
    setName('');
    setLength('');
    setWidth('');
    setQuantity('1');
    setGrain('N/A');
    setNotes('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Panel Cut</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Part Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          margin="dense"
          label={`Length (${unit})`}
          fullWidth
          value={length}
          onChange={(e) => setLength(e.target.value)}
          error={!!errors.length}
          helperText={errors.length}
        />
        <TextField
          margin="dense"
          label={`Width (${unit})`}
          fullWidth
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          error={!!errors.width}
          helperText={errors.width}
        />
        <TextField
          margin="dense"
          label="Quantity"
          fullWidth
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={!!errors.quantity}
          helperText={errors.quantity}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Grain Direction</InputLabel>
          <Select
            value={grain}
            onChange={(e) => setGrain(e.target.value as 'Lengthwise' | 'Widthwise' | 'N/A')}
          >
            <MenuItem value="Lengthwise">Lengthwise</MenuItem>
            <MenuItem value="Widthwise">Widthwise</MenuItem>
            <MenuItem value="N/A">N/A</MenuItem>
          </Select>
          <FormHelperText>Optional - for grain direction sensitive parts</FormHelperText>
        </FormControl>
        <TextField
          margin="dense"
          label="Notes"
          fullWidth
          multiline
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">Add</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPanelCutDialog;