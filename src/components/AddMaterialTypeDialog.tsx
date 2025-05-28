import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Stack,
  IconButton,
  Chip,
  Box
} from '@mui/material';
import { MaterialType, MaterialTypeItem } from '../interfaces/MaterialType';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export interface AddMaterialTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (materialType: MaterialTypeItem, category: string) => void;
  existingCategories: string[];
}

const AddMaterialTypeDialog: React.FC<AddMaterialTypeDialogProps> = ({
  open,
  onClose,
  onSubmit,
  existingCategories
}) => {
  const [category, setCategory] = useState<string>(existingCategories[0] || '');
  const [newCategory, setNewCategory] = useState<string>('');
  const [showNewCategoryField, setShowNewCategoryField] = useState(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [commonItems, setCommonItems] = useState<string[]>([]);
  const [currentItem, setCurrentItem] = useState<string>('');

  const handleSubmit = () => {
    const materialType: MaterialTypeItem = {
      name,
      description,
      common: commonItems
    };

    const selectedCategory = showNewCategoryField ? newCategory : category;
    
    // Validate inputs
    if (!selectedCategory || !name || !description || commonItems.length === 0) {
      return;
    }
    
    onSubmit(materialType, selectedCategory);
    resetForm();
  };

  const resetForm = () => {
    setCategory(existingCategories[0] || '');
    setNewCategory('');
    setShowNewCategoryField(false);
    setName('');
    setDescription('');
    setCommonItems([]);
    setCurrentItem('');
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

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          m: 1,
          width: '100%',
          maxWidth: 520,
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
      <DialogTitle>Add New Material Type</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {showNewCategoryField ? (
            <TextField
              label="New Category"
              fullWidth
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g., Composite, Glass, etc."
            />
          ) : (
            <FormControl fullWidth>
              <InputLabel id="category-select-label">Category</InputLabel>
              <Select
                labelId="category-select-label"
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value as string)}
              >
                {existingCategories.map((cat, index) => (
                  <MenuItem key={index} value={cat}>{cat}</MenuItem>
                ))}
                <MenuItem value="__new__">
                  <em>Add New Category...</em>
                </MenuItem>
              </Select>
            </FormControl>
          )}

          {category === '__new__' && !showNewCategoryField && (
            <Button 
              variant="outlined" 
              onClick={() => {
                setShowNewCategoryField(true);
                setCategory('');
              }}
            >
              Create New Category
            </Button>
          )}

          {(category !== '__new__' || showNewCategoryField) && (
            <>
              <TextField
                label="Material Type Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Hardwood, Thermoplastics, etc."
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this material type"
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
          disabled={
            !name || 
            !description || 
            commonItems.length === 0 || 
            (showNewCategoryField && !newCategory) || 
            (!showNewCategoryField && (category === '' || category === '__new__'))
          }
        >
          Add Material Type
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMaterialTypeDialog;