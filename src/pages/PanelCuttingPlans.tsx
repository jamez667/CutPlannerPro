import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  TextField,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  SelectChangeEvent,
  FormHelperText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { PanelStock } from '../interfaces/PanelStock';
import { PanelPiece } from '../interfaces/PanelPiece';
import { PanelCuttingPlan, PanelCuttingPlanStockItem, PanelCuttingPlanLayout } from '../interfaces/PanelCuttingPlan';
import AddPanelPieceDialog from '../components/AddPanelCutDialog';
import AddPanelDialog from '../components/AddPanelDialog';
import PanelCuttingVisualizer from '../components/PanelCuttingVisualizer';
import { convertFromMetric } from '../utils/unitConversion';
import { formatDimensionValue, formatImperialFraction } from '../utils/formatters';
import Cookies from 'js-cookie';
import { PanelCuttingPlansProps } from '../interfaces/PanelCuttingPlansProps';

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
  const [kerfSize, setKerfSize] = useState<number>(3); // Default kerf size in mm

  // Common kerf sizes in mm
  const commonKerfSizes = [
    { value: 2.4, label: '2.4mm (3/32")' },
    { value: 3.0, label: '3.0mm (1/8")' },
    { value: 3.2, label: '3.2mm (1/8"+)' },
    { value: 4.8, label: '4.8mm (3/16")' },
    { value: 6.4, label: '6.4mm (1/4")' },
    { value: 8.0, label: '8.0mm (5/16")' },
    { value: 9.5, label: '9.5mm (3/8")' }
  ];

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
    // Generate a unique ID that's different for each piece
    const newId = `piece-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`;
    
    // Add the new piece to the existing pieces array
    setRequiredPieces(pieces => [...pieces, { ...pieceData, id: newId }]);
    setAddPanelCutDialogOpen(false);
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
          id: `${piece.id}-${i}`,
          quantity: 1
        });
      }
    });
    
    // Sort pieces by length (longest first) for top-to-bottom placement
    expandedPieces.sort((a, b) => b.length - a.length);
    
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
    
    // Top-to-bottom placement algorithm
    // For each stock sheet
    selectedStockWithMeta.forEach(stockWithMeta => {
      const stock = stockWithMeta.stock;
      totalStockArea += stock.length * stock.width;
      
      // Track placed pieces
      const placedRectangles: {x: number, y: number, length: number, width: number}[] = [];
      
      // Create a layout for this stock
      const layout: PanelCuttingPlanLayout = {
        stockId: stock.id,
        placements: [],
        wastePercentage: 0 // Will calculate after placements
      };
      
      // Function to check if a position is available for a rectangle
      const isPositionAvailable = (x: number, y: number, length: number, width: number): boolean => {
        // Check if the rectangle would go outside the stock boundaries
        if (x < 0 || y < 0 || x + length > stock.length || y + width > stock.width) {
          return false;
        }
        
        // Check if the rectangle overlaps with any placed rectangle (including kerf spacing)
        for (const placed of placedRectangles) {
          // Add kerf size to the overlap check to ensure space for the saw blade
          if (!(x >= placed.x + placed.length + kerfSize || 
                placed.x >= x + length + kerfSize ||
                y >= placed.y + placed.width + kerfSize || 
                placed.y >= y + width + kerfSize)) {
            return false; // Overlap detected or insufficient kerf space
          }
        }
        
        return true;
      };
      
      // Shelf-based placement approach - place pieces top-to-bottom
      // 1. Keep track of "shelves" (horizontal strips)
      // 2. For each piece, find a shelf where it fits or create a new shelf
      
      // Track current shelf height
      let currentShelfY = 0;
      const MAX_SHELF_HEIGHT = stock.width;
      
      for (const piece of expandedPieces) {
        // Skip pieces that have already been placed
        if (layouts.some(l => l.placements.some(p => p.pieceId === piece.id))) {
          continue;
        }
        
        // Check if piece is square - if so, no rotation is needed
        const isSquare = Math.abs(piece.length - piece.width) < 0.001;
        
        // Determine whether piece MUST be rotated based on grain direction constraints
        const mustRotateForGrain = 
          piece.grainDirection !== 'N/A' && 
          stock.grainDirection !== 'N/A' &&
          ((piece.grainDirection === 'Lengthwise' && stock.grainDirection === 'Widthwise') ||
           (piece.grainDirection === 'Widthwise' && stock.grainDirection === 'Lengthwise'));
        
        // Determine whether piece CAN be rotated
        const canRotate = 
          isSquare || 
          piece.grainDirection === 'N/A' || 
          stock.grainDirection === 'N/A' ||
          // Allow rotation if grain directions are perpendicular (actually MUST rotate in this case)
          mustRotateForGrain;
          
        // Logging for debugging
        console.log(`Piece ${piece.id} - ${piece.name}: grain=${piece.grainDirection}, stock grain=${stock.grainDirection}`);
        console.log(`  mustRotateForGrain=${mustRotateForGrain}, canRotate=${canRotate}`);
        
        // Special handling for pieces that MUST be rotated due to grain constraints
        // Try to place with enforced rotation first if grain requires it
        let placed = false;

        // If piece MUST be rotated for grain direction, try placing it rotated first
        if (mustRotateForGrain) {
          let x = 0;
          while (x <= stock.length - piece.width && !placed) {
            if (currentShelfY + piece.length <= MAX_SHELF_HEIGHT && 
                isPositionAvailable(x, currentShelfY, piece.width, piece.length)) {
              // Place the piece rotated
              placedRectangles.push({
                x, y: currentShelfY, length: piece.width, width: piece.length
              });
              
              layout.placements.push({
                pieceId: piece.id,
                x, y: currentShelfY,
                rotated: true
              });
              
              placed = true;
              console.log(`  Piece ${piece.id} ROTATED due to grain direction constraints`);
              x += piece.width + kerfSize; // Move position for next piece
            } else {
              x++; // Try next position
            }
          }
        }
        
        // Try to place without rotation if not already placed and rotation is not mandatory
        if (!placed && !mustRotateForGrain) {
          let x = 0;
          // Try to find space along the current shelf
          while (x <= stock.length - piece.length && !placed) {
            if (currentShelfY + piece.width <= MAX_SHELF_HEIGHT && 
                isPositionAvailable(x, currentShelfY, piece.length, piece.width)) {
              // Place the piece here
              placedRectangles.push({
                x, y: currentShelfY, length: piece.length, width: piece.width
              });
              
              layout.placements.push({
                pieceId: piece.id,
                x, y: currentShelfY,
                rotated: false
              });
              
              placed = true;
              x += piece.length + kerfSize; // Move position for next piece
            } else {
              x++; // Try next position
            }
          }
        }
        
        // If we couldn't place without rotation, try with rotation if allowed
        if (!placed && canRotate) {
          let x = 0;
          while (x <= stock.length - piece.width && !placed) {
            if (currentShelfY + piece.length <= MAX_SHELF_HEIGHT && 
                isPositionAvailable(x, currentShelfY, piece.width, piece.length)) {
              // Place the piece rotated
              placedRectangles.push({
                x, y: currentShelfY, length: piece.width, width: piece.width
              });
              
              layout.placements.push({
                pieceId: piece.id,
                x, y: currentShelfY,
                rotated: true
              });
              
              placed = true;
              x += piece.width + kerfSize; // Move position for next piece
            } else {
              x++; // Try next position
            }
          }
        }
        
        // If still not placed, start a new shelf
        if (!placed) {
          // Find the tallest piece in the current shelf to determine next shelf Y position
          let maxHeight = 0;
          for (const rect of placedRectangles) {
            if (rect.y === currentShelfY && rect.width > maxHeight) {
              maxHeight = rect.width;
            }
          }
          
          // If no pieces in current shelf, use a default height
          if (maxHeight === 0) maxHeight = Math.min(piece.width, MAX_SHELF_HEIGHT / 4);
          
          // Move to next shelf
          currentShelfY += maxHeight + kerfSize;
          
          // Try again on new shelf if there's room
          if (currentShelfY + piece.width <= MAX_SHELF_HEIGHT) {
            let x = 0;
            
            // First try to place according to grain direction constraints
            if (mustRotateForGrain && currentShelfY + piece.length <= MAX_SHELF_HEIGHT && 
                isPositionAvailable(x, currentShelfY, piece.width, piece.length)) {
              // Place the piece rotated since grain direction requires it
              placedRectangles.push({
                x, y: currentShelfY, length: piece.width, width: piece.length
              });
              
              layout.placements.push({
                pieceId: piece.id,
                x, y: currentShelfY,
                rotated: true
              });
              
              placed = true;
              console.log(`  Piece ${piece.id} ROTATED on new shelf due to grain constraints`);
            }
            // If not mandatory to rotate by grain, try normal orientation first
            else if (!mustRotateForGrain && isPositionAvailable(x, currentShelfY, piece.length, piece.width)) {
              // Place the piece on the new shelf
              placedRectangles.push({
                x, y: currentShelfY, length: piece.length, width: piece.width
              });
              
              layout.placements.push({
                pieceId: piece.id,
                x, y: currentShelfY,
                rotated: false
              });
              
              placed = true;
            } 
            // If not placed with normal orientation, try rotated if allowed
            else if (canRotate && isPositionAvailable(x, currentShelfY, piece.width, piece.length)) {
              placedRectangles.push({
                x, y: currentShelfY, length: piece.width, width: piece.length
              });
              
              layout.placements.push({
                pieceId: piece.id,
                x, y: currentShelfY,
                rotated: true
              });
              
              placed = true;
              console.log(`  Piece ${piece.id} ROTATED on new shelf`);
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
    console.log('layout count:', layouts.length);
    layouts.forEach(layout => {
      layout.placements.forEach(placement => {
        const expandedPiece = expandedPieces.find(c => c.id === placement.pieceId);
        if (expandedPiece) {
          totalUsedArea += expandedPiece.length * expandedPiece.width;
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
      // Store the expanded pieces to make them available for visualization
      expandedPieces: expandedPieces,
      layouts,
      wastagePercentage,
      notes: notes || '',
      kerfSize: kerfSize
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
        
        {/* Kerf Size Input */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Kerf Size</Typography>
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel id="kerf-size-label">Saw Kerf Width</InputLabel>
            <Select
              labelId="kerf-size-label"
              id="kerf-size-select"
              value={kerfSize.toString()}
              onChange={(e) => setKerfSize(Number(e.target.value))}
              label="Saw Kerf Width"
            >
              {commonKerfSizes.map((option) => (
                <MenuItem key={option.value} value={option.value.toString()}>
                  {formatDimensionValue(option.value, "thickness", units)}
                </MenuItem>
              ))}
              <MenuItem divider />
              <MenuItem value="custom">
                Custom Size
              </MenuItem>
            </Select>
            <FormHelperText>Width of the saw blade cut</FormHelperText>
          </FormControl>
          
          {/* Show custom input if "Custom Size" is selected */}
          {kerfSize.toString() === 'custom' && (
            <TextField
              label="Custom Kerf Size (mm)"
              type="number"
              onChange={(e) => {
                const value = Number(e.target.value);
                if (!isNaN(value) && value > 0) {
                  setKerfSize(value);
                }
              }}
              sx={{ mt: 2, width: 300 }}
              InputProps={{
                inputProps: { min: 0.1, step: 0.1 }
              }}
            />
          )}
        </Box>
        
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
                    {stock.description} ({formatDimensionValue(stock.length, "length", units)} x {formatDimensionValue(stock.width, "width", units)} {useMetric ? 'mm' : 'in'}) {stock.grainDirection}
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
                  <TableCell>Length</TableCell>
                  <TableCell>Width</TableCell>
                  <TableCell>Thickness</TableCell>
                  <TableCell>Grain Direction</TableCell>
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
                      <TableCell>{formatDimensionValue(stock.stock.length, "length", units)}</TableCell>
                      <TableCell>{formatDimensionValue(stock.stock.width, "width", units)}</TableCell>
                      <TableCell>{formatDimensionValue(stock.stock.thickness, "thickness", units, true)}</TableCell>
                      <TableCell>{stock.stock.grainDirection}</TableCell>
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
            
            // Find the pieces that are placed in this layout - using generatedPlan.expandedPieces
            const layoutPieces = generatedPlan.expandedPieces?.filter(
              (p: PanelPiece) => layout.placements.some(placement => placement.pieceId === p.id)
            ) || [];
            
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
                    kerfSize={kerfSize}
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