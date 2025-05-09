import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  IconButton,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { MaterialType, MaterialTypeItem } from '../interfaces/MaterialType';
import AddIcon from '@mui/icons-material/Add';

export interface EditMaterialTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (updatedMaterialType: MaterialTypeItem, categoryName: string, originalName: string) => void;
  materialTypes: MaterialType[];
}

const EditMaterialTypeDialog: React.FC<EditMaterialTypeDialogProps> = ({
  open,
  onClose,
  onSubmit,
  materialTypes
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMaterialType, setSelectedMaterialType] = useState<string>('');
  const [currentItem, setCurrentItem] = useState<string>('');
  const [materialItem, setMaterialItem] = useState<MaterialTypeItem | null>(null);
  const [commonItems, setCommonItems] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');

  // Memoize material type options to prevent unnecessary recalculations
  const materialTypeOptions = React.useMemo(() => {
    if (!selectedCategory) return [];
    const category = materialTypes.find(m => m.category === selectedCategory);
    return category?.items.map(item => item.name) || [];
  }, [selectedCategory, materialTypes]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && materialTypes.length > 0) {
      // Initialize with first category
      const firstCategory = materialTypes[0].category;
      setSelectedCategory(firstCategory);
      
      // Initialize with first material type in that category
      if (materialTypes[0].items.length > 0) {
        const firstMaterialType = materialTypes[0].items[0].name;
        setSelectedMaterialType(firstMaterialType);
      }
    } else if (!open) {
      resetForm();
    }
  }, [open, materialTypes]);

  // Load material data when category or material type changes
  const loadMaterialData = useCallback(() => {
    if (selectedCategory && selectedMaterialType) {
      const category = materialTypes.find(c => c.category === selectedCategory);
      if (category) {
        const item = category.items.find(i => i.name === selectedMaterialType);
        if (item) {
          setMaterialItem(item);
          setCommonItems([...item.common]);
          setDescription(item.description);
          return;
        }
      }
    }
    
    setMaterialItem(null);
    setCommonItems([]);
    setDescription('');
  }, [selectedCategory, selectedMaterialType, materialTypes]);

  // Effect to load data when selection changes
  useEffect(() => {
    loadMaterialData();
  }, [loadMaterialData]);

  // Handle category change
  const handleCategoryChange = (event: SelectChangeEvent) => {
    const newCategory = event.target.value as string;
    setSelectedCategory(newCategory);
    
    // Find the new category and set the first material type in it
    const category = materialTypes.find(c => c.category === newCategory);
    if (category && category.items.length > 0) {
      setSelectedMaterialType(category.items[0].name);
    } else {
      setSelectedMaterialType('');
    }
  };

  // Handle material type change
  const handleMaterialTypeChange = (event: SelectChangeEvent) => {
    setSelectedMaterialType(event.target.value as string);
  };

  const resetForm = () => {
    setSelectedCategory('');
    setSelectedMaterialType('');
    setCurrentItem('');
    setMaterialItem(null);
    setCommonItems([]);
    setDescription('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddCommonItem = () => {
    if (currentItem.trim() !== '' && !commonItems.includes(currentItem.trim())) {
      setCommonItems([...commonItems, currentItem.trim()]);
      setCurrentItem('');
    }
  };

  const handleDeleteCommonItem = (itemToDelete: string) => {
    setCommonItems(commonItems.filter(item => item !== itemToDelete));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddCommonItem();
    }
  };

  const handleSubmit = () => {
    if (selectedCategory && selectedMaterialType && materialItem) {
      const updatedMaterialType: MaterialTypeItem = {
        name: materialItem.name,
        description: description,
        common: commonItems
      };
      
      onSubmit(updatedMaterialType, selectedCategory, selectedMaterialType);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Material Type</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="category-select-label">Category</InputLabel>
            <Select
              labelId="category-select-label"
              value={selectedCategory}
              label="Category"
              onChange={handleCategoryChange}
            >
              {materialTypes.map((cat, index) => (
                <MenuItem key={index} value={cat.category}>{cat.category}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedCategory && (
            <FormControl fullWidth>
              <InputLabel id="material-type-select-label">Material Type</InputLabel>
              <Select
                labelId="material-type-select-label"
                value={selectedMaterialType}
                label="Material Type"
                onChange={handleMaterialTypeChange}
              >
                {materialTypeOptions.map((typeName, index) => (
                  <MenuItem key={index} value={typeName}>{typeName}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {materialItem && (
            <>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <Typography variant="subtitle1" gutterBottom>
                Common Examples
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  label="Add Common Example"
                  fullWidth
                  value={currentItem}
                  onChange={(e) => setCurrentItem(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Oak, PVC, etc."
                />
                <IconButton 
                  color="primary" 
                  onClick={handleAddCommonItem}
                  disabled={!currentItem.trim()}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {commonItems.map((item, index) => (
                  <Chip
                    key={index}
                    label={item}
                    onDelete={() => handleDeleteCommonItem(item)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="inherit">Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={!materialItem || commonItems.length === 0 || !description}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditMaterialTypeDialog;