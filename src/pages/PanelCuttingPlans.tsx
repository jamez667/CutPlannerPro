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
import { PanelPiece } from '../interfaces/PanelPiece';
import { PanelCuttingPlan, PanelCuttingPlanStockItem, PanelCuttingPlanLayout } from '../interfaces/PanelCuttingPlan';
import AddPanelPieceDialog from '../components/AddPanelCutDialog';
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
  const [requiredPieces, setRequiredPieces] = useState<PanelPiece[]>([]);
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
  const handlePieceSubmit = (pieceData: Omit<PanelPiece, 'id'>) => {
    const newId = "1";
    setRequiredPieces(pieces => [...pieces, { ...pieceData, id: newId }]);
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
    const plannedPieces = requiredPieces.filter(piece => piece.quantity > 0);
    
    if (selectedPanelStocks.length === 0) {
      setError('Please select at least one panel stock');
      return;
    }
    
    if (plannedPieces.length === 0) {
      setError('Please add at least one piece with quantity greater than 0');
      return;
    }
    
    // Expand pieces based on quantity
    const expandedPieces: PanelPiece[] = [];
    plannedPieces.forEach(piece => {
      for (let i = 0; i < piece.quantity; i++) {
        expandedPieces.push({
          ...piece,
          id: "1",
          quantity: 1
        });
      }
    });
    
    // Sort pieces by area (largest first) for better packing
    expandedPieces.sort((a, b) => (b.length * b.width) - (a.length * a.width));
    
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
    expandedPieces.forEach(cut => {
      totalCutArea += cut.length * cut.width;
    });
    
    // Simple first-fit algorithm
    // For each stock sheet
    selectedStockWithMeta.forEach(stockWithMeta => {
      const stock = stockWithMeta.stock;
      totalStockArea += stock.length * stock.width;
      
      // Instead of creating a massive grid, use a more efficient data structure
      // to track occupied spaces (just store the placed rectangles)
      const placedRectangles: {x: number, y: number, width: number, height: number}[] = [];
      
      // Create a layout for this stock
      const layout: PanelCuttingPlanLayout = {
        stockId: stock.id,
        placements: [],
        wastePercentage: 0 // Will calculate after placements
      };
      
      // Function to check if a position is available for a rectangle
      const isPositionAvailable = (x: number, y: number, width: number, height: number): boolean => {
        // Check if the rectangle would go outside the stock boundaries
        if (x < 0 || y < 0 || x + width > stock.length || y + height > stock.width) {
          return false;
        }
        
        // Check if the rectangle overlaps with any placed rectangle
        for (const placed of placedRectangles) {
          // Check for overlap
          if (!(x + width <= placed.x || placed.x + placed.width <= x || 
                y + height <= placed.y || placed.y + placed.height <= y)) {
            return false;
          }
        }
        
        return true;
      };
      
      // Try to place each cut
      for (const cut of expandedPieces) {
        // Skip pieces that have already been placed
        if (layouts.some(l => l.placements.some(p => p.pieceId === cut.id))) {
          continue;
        }
        
        // Try to find a spot for this cut
        let placed = false;
        
        // Try placing without rotation first
        // Use a more efficient scanning approach
        for (let x = 0; x <= stock.length - cut.length && !placed; x += 1) {
          for (let y = 0; y <= stock.width - cut.width && !placed; y += 1) {
            // Try to place the cut at this position
            if (isPositionAvailable(x, y, cut.length, cut.width)) {
              // Record the placement
              placedRectangles.push({
                x, 
                y, 
                width: cut.length, 
                height: cut.width
              });
              
              layout.placements.push({
                pieceId: cut.id,
                x,
                y,
                rotated: false
              });
              
              placed = true;
            }
          }
        }
        
        // If not placed, try with rotation if cut dimensions are different
        if (!placed && cut.length !== cut.width) {
          for (let x = 0; x <= stock.length - cut.width && !placed; x += 1) {
            for (let y = 0; y <= stock.width - cut.length && !placed; y += 1) {
              // Try to place the rotated cut at this position
              if (isPositionAvailable(x, y, cut.width, cut.length)) {
                // Record the placement
                placedRectangles.push({
                  x, 
                  y, 
                  width: cut.width, 
                  height: cut.length
                });
                
                layout.placements.push({
                  pieceId: cut.id,
                  x,
                  y,
                  rotated: true
                });
                
                placed = true;
              }
            }
          }
        }
      }
      
      // Calculate waste percentage for this layout
      let usedArea = 0;
      layout.placements.forEach(placement => {
        const cut = expandedPieces.find(c => c.id === placement.pieceId);
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
        const cut = expandedPieces.find(c => c.id === placement.pieceId);
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
      requiredPieces: plannedPieces,
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
        
        {/* Pieces Needed */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Pieces Needed</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddCutClick}
              disabled={!selectedStock}
            >
              Add Piece
            </Button>
          </Box>
          
          <div style={{ height: 300, width: '100%' }}>
            <DataGrid
              rows={requiredPieces}
              columns={[
                { field: 'name', headerName: 'Name', width: 120 },
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
                        setRequiredPieces(pieces => pieces.filter(cut => cut.id !== params.id));
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
              disabled={selectedStockItems.length === 0 || requiredPieces.length === 0}
              onClick={generateCuttingPlan}
            >
              Generate Cutting Plan
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Add Piece Dialog */}
      <AddPanelPieceDialog
        open={addPanelCutDialogOpen}
        onClose={handleCutDialogClose}
        onAdd={handlePieceSubmit}
        unit={useMetric ? 'mm' : 'in'}
        nextId={"1"}
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
            
            // Find the pieces that are placed in this layout
            console.log('pieces internal:', generatedPlan.requiredPieces);
            console.log('layout.placements:', layout.placements);
            console.log('generatedPlan:', generatedPlan);
            const layoutPieces = generatedPlan.requiredPieces.filter(piece => {
              const isPieceInLayout = layout.placements.some(placement => placement.pieceId === piece.id);
              console.log(`Piece ID ${piece.id} is in layout: ${isPieceInLayout}`);
              return isPieceInLayout;
            });
            
            return (
              <Box key={layout.stockId} sx={{ mt: 3, mb: 5, border: '1px solid #ccc', padding: 2 }}>
                <Typography variant="h6">
                  Stock: {stockItem.description} ({convertFromMetric(stockItem.length, units)} x {convertFromMetric(stockItem.width, units)} {useMetric ? 'mm' : 'in'}) {stockItem.grainDirection}
                </Typography>
                <Typography variant="body2">
                  Wastage for this sheet: {layout.wastePercentage}%
                </Typography>
                <Box sx={{ mt: 2, overflow: 'auto' }}>
                  <PanelCuttingVisualizer 
                    stock={stockItem}
                    pieces={layoutPieces}
                    layout={layout}
                    unit={useMetric ? 'mm' : 'in'}
                  />
                </Box>
              </Box>
            );
          })}
          
          {/* Display any unplaced pieces if we have them */}
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