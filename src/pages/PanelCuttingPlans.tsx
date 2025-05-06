import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Checkbox,
  Switch,
  FormControlLabel,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  SelectChangeEvent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { PanelStock } from '../interfaces/PanelStock';
import { PanelCut } from '../interfaces/PanelCut';
import { PanelCuttingPlan, PanelCuttingPlanStockItem, PanelCuttingPlanLayout } from '../interfaces/PanelCuttingPlan';
import AddPanelCutDialog from '../components/AddPanelCutDialog';
import AddPanelDialog from '../components/AddPanelDialog';
import PanelCuttingVisualizer from '../components/PanelCuttingVisualizer';
import { convertFromMetric, convertToMetric } from '../utils/unitConversion';
import { formatDimensionValue, formatImperialFraction } from '../utils/formatters';
import Cookies from 'js-cookie';

interface PanelCuttingPlansProps {
  units: 'in' | 'mm';
}

const PanelCuttingPlans: React.FC<PanelCuttingPlansProps> = ({ units }) => {
  const [availablePanelStocks, setAvailablePanelStocks] = useState<PanelStock[]>([]);
  const [selectedStockItems, setSelectedStockItems] = useState<PanelCuttingPlanStockItem[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [requiredCuts, setRequiredCuts] = useState<PanelCut[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<PanelCuttingPlan | null>(null);
  const [addPanelCutDialogOpen, setAddPanelCutDialogOpen] = useState<boolean>(false);
  const [addPanelDialogOpen, setAddPanelDialogOpen] = useState<boolean>(false);
  const [planName, setPlanName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [useMetric, setUseMetric] = useState<boolean>(units === 'mm');
  const [savedPlans, setSavedPlans] = useState<PanelCuttingPlan[]>([]);
  const [woodSpeciesOptions, setWoodSpeciesOptions] = useState<string[]>([
    'Pine', 'Oak', 'Maple', 'Cherry', 'Walnut', 'Birch', 'Plywood', 'MDF', 'Particleboard'
  ]);
  const [showVisualization, setShowVisualization] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Load panel stock from cookies on component mount
  useEffect(() => {
    try {
      const savedPanelStock = Cookies.get('panelStock');
      if (savedPanelStock) {
        const parsed = JSON.parse(savedPanelStock);
        setAvailablePanelStocks(parsed.map((item: any) => ({
          ...item,
          length: Number(item.length),
          width: Number(item.width),
          thickness: Number(item.thickness),
          quantity: Number(item.quantity),
          pricePer: Number(item.pricePer)
        })));
      }
    } catch (e) {
      console.error('Error loading panel stock data:', e);
    }
  }, []);

  // Handle stock selection
  const handleStockSelect = (event: SelectChangeEvent<string>) => {
    const selectedValue = event.target.value;
    
    if (selectedValue === "add-new") {
      setAddPanelDialogOpen(true);
      return;
    }
    
    const selectedId = parseInt(selectedValue);
    setSelectedStockId(selectedId);
    
    // Find the selected stock in available stocks
    const stockToAdd = availablePanelStocks.find(stock => stock.id === selectedId);
    if (stockToAdd) {
      // Check if stock is already in the selected items
      if (!selectedStockItems.some(item => item.stock.id === selectedId)) {
        // Add it with the next priority number
        const nextPriority = selectedStockItems.length > 0 
          ? Math.max(...selectedStockItems.map(item => item.priority)) + 1 
          : 1;
        
        setSelectedStockItems([
          ...selectedStockItems, 
          { stock: stockToAdd, priority: nextPriority }
        ]);
      }
    }
  };

  // Handle stock priority change
  const handlePriorityChange = (stockId: number, direction: 'up' | 'down') => {
    setSelectedStockItems(prevItems => {
      const index = prevItems.findIndex(item => item.stock.id === stockId);
      if (index === -1) return prevItems;

      const newItems = [...prevItems];
      const [movedItem] = newItems.splice(index, 1);
      const newIndex = direction === 'up' ? index - 1 : index + 1;

      if (newIndex >= 0 && newIndex < newItems.length) {
        newItems.splice(newIndex, 0, movedItem);
      } else {
        newItems.push(movedItem);
      }

      return newItems.map((item, idx) => ({ ...item, priority: idx + 1 }));
    });
  };

  // Handle removing a stock item
  const handleRemoveStock = (stockId: number) => {
    setSelectedStockItems((prevItems) => prevItems.filter(item => item.stock.id !== stockId));
  };

  // Get selected stock details
  const selectedStock = selectedStockItems.length > 0 ? selectedStockItems[0] : null;

  // Handle opening the add cut dialog
  const handleAddCutClick = () => {
    setAddPanelCutDialogOpen(true);
  };

  // Handle closing the cut dialog
  const handleCutDialogClose = () => {
    setAddPanelCutDialogOpen(false);
  };

  // Handle submitting a cut
  const handleCutSubmit = (cutData: Omit<PanelCut, 'id'>) => {
    const newId = requiredCuts.length === 0 ? 1 : Math.max(...requiredCuts.map(cut => cut.id)) + 1;
    setRequiredCuts(cuts => [...cuts, { ...cutData, id: newId }]);
    setAddPanelCutDialogOpen(false);
  };

  // Format stock dimensions for display
  const formatStockDimension = (value: number) => {
    if (!useMetric) {
      const inValue = convertFromMetric(value, 'in');
      return formatImperialFraction(inValue);
    }
    return Math.round(value);
  };

  // Handle generating the cutting plan
  const generateCuttingPlan = () => {
    const selectedPanelStocks = selectedStockItems.map(item => item.stock);
    const plannedCuts = requiredCuts.filter(cut => cut.quantity > 0);
    
    if (selectedPanelStocks.length === 0) {
      setError('Please select at least one panel stock');
      return;
    }
    
    if (plannedCuts.length === 0) {
      setError('Please add at least one cut with quantity greater than 0');
      return;
    }
    
    // Expand cuts based on quantity
    const expandedCuts: PanelCut[] = [];
    plannedCuts.forEach(cut => {
      for (let i = 0; i < cut.quantity; i++) {
        expandedCuts.push({
          ...cut,
          id: cut.id * 1000 + i, // Create unique numeric IDs for each instance
          quantity: 1
        });
      }
    });
    
    // Sort cuts by area (largest first) for better packing
    expandedCuts.sort((a, b) => (b.length * b.width) - (a.length * a.width));
    
    // Initialize our cutting plan
    const layouts: PanelCuttingPlanLayout[] = [];
    let totalStockArea = 0;
    let totalCutArea = 0;
    
    // Convert selected stocks to the format needed for the plan
    const selectedStockWithMeta = selectedPanelStocks.map((panel, index) => ({
      stock: panel,
      priority: index + 1 // Add the required priority property
    }));
    
    // Calculate total cut area
    expandedCuts.forEach(cut => {
      totalCutArea += cut.length * cut.width;
    });
    
    // Simple first-fit algorithm
    // For each stock sheet
    selectedStockWithMeta.forEach(stockWithMeta => {
      const stock = stockWithMeta.stock;
      totalStockArea += stock.length * stock.width;
      
      // Define placement grid (we can improve this with a more sophisticated algorithm later)
      const grid: boolean[][] = Array(stock.length).fill(0).map(() => Array(stock.width).fill(false));
      
      // Create a layout for this stock
      const layout: PanelCuttingPlanLayout = {
        stockId: stock.id,
        placements: [],
        wastePercentage: 0 // Will calculate after placements
      };
      
      // Try to place each cut
      for (const cut of expandedCuts) {
        // Skip cuts that have already been placed
        if (layouts.some(l => l.placements.some(p => p.cutId === cut.id))) {
          continue;
        }
        
        // Try to find a spot for this cut
        let placed = false;
        
        // Scan through the grid to find an empty spot
        for (let x = 0; x <= stock.length - cut.length && !placed; x++) {
          for (let y = 0; y <= stock.width - cut.width && !placed; y++) {
            // Check if this spot is available
            let spotAvailable = true;
            for (let dx = 0; dx < cut.length && spotAvailable; dx++) {
              for (let dy = 0; dy < cut.width && spotAvailable; dy++) {
                if (grid[x + dx][y + dy]) {
                  spotAvailable = false;
                }
              }
            }
            
            // If spot is available, place the cut
            if (spotAvailable) {
              // Mark the grid as occupied
              for (let dx = 0; dx < cut.length; dx++) {
                for (let dy = 0; dy < cut.width; dy++) {
                  grid[x + dx][y + dy] = true;
                }
              }
              
              // Add the placement to the layout
              layout.placements.push({
                cutId: cut.id,
                x,
                y,
                rotated: false // Add the missing required property
              });
              
              placed = true;
            }
          }
        }
      }
      
      // Calculate waste percentage for this layout
      let usedArea = 0;
      layout.placements.forEach(placement => {
        const cut = expandedCuts.find(c => c.id === placement.cutId);
        if (cut) {
          usedArea += cut.length * cut.width;
        }
      });
      
      const stockArea = stock.length * stock.width;
      layout.wastePercentage = Math.round((1 - (usedArea / stockArea)) * 100);
      
      // Only add layouts that have placements
      if (layout.placements.length > 0) {
        layouts.push(layout);
      }
    });
    
    // Calculate overall waste percentage
    let totalUsedArea = 0;
    layouts.forEach(layout => {
      layout.placements.forEach(placement => {
        const cut = expandedCuts.find(c => c.id === placement.cutId);
        if (cut) {
          totalUsedArea += cut.length * cut.width;
        }
      });
    });
    
    const wastagePercentage = Math.round((1 - (totalUsedArea / totalStockArea)) * 100);
    
    // Final cutting plan
    const cuttingPlan: PanelCuttingPlan = {
      id: new Date().getTime(), // Use numeric timestamp as id
      name: planName || `Plan ${new Date().toLocaleDateString()}`,
      createdDate: new Date(),
      updatedDate: new Date(),
      selectedStock: selectedStockWithMeta,
      requiredCuts: plannedCuts,
      layouts,
      wastagePercentage,
      notes: notes || ''
    };
    
    setGeneratedPlan(cuttingPlan);
    setShowVisualization(true);
    setError('');
  };

  // Save the generated plan
  const handleSavePlan = () => {
    if (!generatedPlan) return;
    
    try {
      const savedPlansJson = Cookies.get('savedPanelCuttingPlans');
      let savedPlans: PanelCuttingPlan[] = [];
      
      if (savedPlansJson) {
        savedPlans = JSON.parse(savedPlansJson);
      }
      
      savedPlans.push(generatedPlan);
      Cookies.set('savedPanelCuttingPlans', JSON.stringify(savedPlans));
      
      // Update local state
      setSavedPlans(savedPlans);
      
      // Reset form for new plan
      setPlanName('');
      setNotes('');
      
      alert('Cutting plan saved successfully!');
    } catch (err) {
      console.error('Error saving cutting plan:', err);
      alert('Failed to save cutting plan.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Panel Cutting Plans</Typography>
        
        {/* Stock Selection */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Selected Stock</Typography>
          <Box sx={{ mb: 2 }}>
            <FormControl sx={{ width: '100%' }}>
              <InputLabel id="add-stock-label">Add Stock</InputLabel>
              <Select
                labelId="add-stock-label"
                id="add-stock-select"
                label="Add Stock"
                value=""
                onChange={handleStockSelect}
              >
                {availablePanelStocks.map((stock) => (
                  <MenuItem key={stock.id} value={stock.id}>
                    {stock.description} ({formatStockDimension(stock.length)} x {formatStockDimension(stock.width)})
                  </MenuItem>
                ))}
                <MenuItem divider />
                <MenuItem value="add-new">
                  <AddIcon sx={{ mr: 1 }} />
                  Add new stock
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Dimensions</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedStockItems.length > 0 ? (
                  selectedStockItems.map((stock) => (
                    <TableRow key={stock.stock.id}>
                      <TableCell>{stock.stock.description}</TableCell>
                      <TableCell>{formatStockDimension(stock.stock.length)} x {formatStockDimension(stock.stock.width)} {useMetric ? 'mm' : 'in'}</TableCell>
                      <TableCell>{stock.stock.quantity}</TableCell>
                      <TableCell>{stock.priority}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handlePriorityChange(stock.stock.id, 'up')}>
                          <ArrowUpwardIcon />
                        </IconButton>
                        <IconButton onClick={() => handlePriorityChange(stock.stock.id, 'down')}>
                          <ArrowDownwardIcon />
                        </IconButton>
                        <IconButton onClick={() => handleRemoveStock(stock.stock.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No stock selected. Please select stock from the dropdown above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        
        {/* Cuts Needed */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Cuts Needed</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddCutClick}
              disabled={!selectedStock}
            >
              Add Cut
            </Button>
          </Box>
          
          <div style={{ height: 300, width: '100%' }}>
            <DataGrid
              rows={requiredCuts}
              columns={[
                { field: 'label', headerName: 'Label', width: 120 },
                { field: 'quantity', headerName: 'Qty', width: 80, type: 'number' },
                { 
                  field: 'length', 
                  headerName: `Length (${useMetric ? 'mm' : 'in'})`, 
                  width: 120,
                  type: 'number',
                  renderCell: (params) => {
                    const value = params.row.length;
                    if (!useMetric) {
                      const displayValue = convertFromMetric(value, 'in');
                      return `${formatImperialFraction(displayValue)}`;
                    } else {
                      return Math.round(value);
                    }
                  }
                },
                { 
                  field: 'width', 
                  headerName: `Width (${useMetric ? 'mm' : 'in'})`, 
                  width: 120,
                  type: 'number',
                  renderCell: (params) => {
                    const value = params.row.width;
                    if (!useMetric) {
                      const displayValue = convertFromMetric(value, 'in');
                      return `${formatImperialFraction(displayValue)}`;
                    } else {
                      return Math.round(value);
                    }
                  }
                },
                {
                  field: 'actions',
                  type: 'actions',
                  headerName: 'Actions',
                  width: 100,
                  getActions: (params) => [
                    <GridActionsCellItem
                      icon={<DeleteIcon />}
                      label="Delete"
                      onClick={() => {
                        setRequiredCuts(cuts => cuts.filter(cut => cut.id !== params.id));
                      }}
                    />
                  ]
                }
              ]}
              pageSizeOptions={[5, 10]}
              disableRowSelectionOnClick
              getRowId={(row) => row.id}
            />
          </div>
          
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              label="Plan Name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              disabled={selectedStockItems.length === 0 || requiredCuts.length === 0}
              onClick={generateCuttingPlan}
            >
              Generate Cutting Plan
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Add Cut Dialog */}
      <AddPanelCutDialog
        open={addPanelCutDialogOpen}
        onClose={handleCutDialogClose}
        onAdd={handleCutSubmit}
        unit={useMetric ? 'mm' : 'in'}
        nextId={requiredCuts.length === 0 ? 1 : Math.max(...requiredCuts.map(cut => cut.id)) + 1}
      />

      {/* Add Panel Dialog */}
      <AddPanelDialog
        open={addPanelDialogOpen}
        onClose={() => setAddPanelDialogOpen(false)}
        onSubmit={(newPanel) => {
          const newId = availablePanelStocks.length > 0 
            ? Math.max(...availablePanelStocks.map(stock => stock.id)) + 1 
            : 1;
          const panelWithId = { ...newPanel, id: newId };
          setAvailablePanelStocks([...availablePanelStocks, panelWithId]);
          setAddPanelDialogOpen(false);
        }}
        editingId={null}
        initialData={{
          length: 0,
          width: 0,
          thickness: 0,
          quantity: 1,
          grainDirection: 'N/A',
          woodSpecies: '',
          description: '',
          pricePer: 0
        }}
        units={units}
        woodSpeciesOptions={woodSpeciesOptions}
        setWoodSpeciesOptions={setWoodSpeciesOptions}
      />
      
      {/* Visualization Section */}
      {showVisualization && generatedPlan && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Cutting Plan Visualization
          </Typography>
          <Typography variant="body1">
            Wastage: {generatedPlan.wastagePercentage}% | Material Utilization: {100 - generatedPlan.wastagePercentage}%
          </Typography>
          
          {/* Display each layout with its corresponding stock */}
          {generatedPlan.layouts.map((layout) => {
            // Find the stock that corresponds to this layout
            const stockItem = generatedPlan.selectedStock.find(item => 
              item.stock.id === layout.stockId
            )?.stock;
            
            if (!stockItem) return null;
            
            // Find the cuts that are placed in this layout
            const layoutCuts = generatedPlan.requiredCuts.filter(cut => 
              layout.placements.some(placement => placement.cutId === cut.id)
            );
            
            return (
              <Box key={layout.stockId} sx={{ mt: 3, mb: 5, border: '1px solid #ccc', padding: 2 }}>
                <Typography variant="h6">
                  Stock: {stockItem.description} ({stockItem.length} x {stockItem.width} {useMetric ? 'mm' : 'in'})
                </Typography>
                <Typography variant="body2">
                  Wastage for this sheet: {layout.wastePercentage}%
                </Typography>
                <Box sx={{ mt: 2, overflow: 'auto' }}>
                  <PanelCuttingVisualizer 
                    stock={stockItem}
                    cuts={layoutCuts}
                    layout={layout}
                    unit={useMetric ? 'mm' : 'in'}
                  />
                </Box>
              </Box>
            );
          })}
          
          {/* Display any unplaced cuts if we have them */}
          {generatedPlan.layouts.length === 0 && (
            <Typography variant="body1" color="error">
              No layouts could be generated. Please adjust your stock or cut requirements.
            </Typography>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined"
              onClick={() => setShowVisualization(false)}
            >
              Hide Visualization
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSavePlan}
            >
              Save This Plan
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default PanelCuttingPlans;