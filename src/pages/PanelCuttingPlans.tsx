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
import { RequiresUnitsProps } from '../interfaces/RequiresUnitsProps';
import { useLocation, useNavigate } from 'react-router-dom';

const PanelCuttingPlans: React.FC<RequiresUnitsProps> = ({ units }) => {
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
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
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

  // Load saved plans from cookies
  useEffect(() => {
    try {
      const savedPlansJson = Cookies.get('savedPanelCuttingPlans');
      if (savedPlansJson) {
        const parsedPlans = JSON.parse(savedPlansJson);
        setSavedPlans(parsedPlans);
      }
    } catch (e) {
      console.error('Error loading saved plans:', e);
    }
  }, []);

  // Load plan from URL parameters if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const loadPlanId = params.get('loadPlan');
    
    if (loadPlanId && savedPlans.length > 0) {
      const id = parseInt(loadPlanId);
      const planToEdit = savedPlans.find(plan => plan.id === id);
      
      if (planToEdit) {
        setEditingPlanId(id);
        setPlanName(planToEdit.name);
        setNotes(planToEdit.notes || '');
        setKerfSize(planToEdit.kerfSize || 3); // Default to 3mm if undefined
        setSelectedStockItems(planToEdit.selectedStock);
        setRequiredPieces(planToEdit.requiredPieces);
        setGeneratedPlan(planToEdit);
        
        // Automatically open the visualization for the loaded plan
        setShowVisualization(true);
      } else {
        console.warn('No plan found with id:', id);
      }
    }
  }, [location.search, savedPlans]);

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
    
    // Sort pieces by their largest dimension after considering potential rotation
    expandedPieces.sort((a, b) => {
      const aLongest = Math.max(a.length, a.width);
      const bLongest = Math.max(b.length, b.width);
      return bLongest - aLongest; // Descending order (longest first)
    });
    
    console.log("Sorted pieces by longest dimension:", expandedPieces.map(p => 
      `${p.name}: ${Math.max(p.length, p.width)}mm`).join(', '));
    
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
    
    // Track which pieces have been placed
    const placedPieceIds = new Set<string>();
    
    // Function to check if a position is available for a rectangle
    const isPositionAvailable = (
      placedRectangles: {x: number, y: number, length: number, width: number}[], 
      stock: PanelStock,
      x: number, 
      y: number, 
      length: number, 
      width: number
    ): boolean => {
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
    
    // Function to try placing a piece with given dimensions starting from the top
    const tryPlaceFromTop = (
      placedRectangles: {x: number, y: number, length: number, width: number}[],
      stock: PanelStock,
      piece: PanelPiece,
      pieceLength: number, 
      pieceWidth: number, 
      isRotated: boolean
    ): {placed: boolean, x?: number, y?: number} => {
      // For left-to-right, top-to-bottom filling, we need to find the topmost open position
      // and then scan from left to right at that Y-coordinate
      
      // Create a grid of Y positions to try, starting from the top
      const maxY = stock.width - pieceWidth;
      let bestY = Infinity;
      let bestX = Infinity;

      // For each possible y position
      for (let y = 0; y <= maxY; y++) {
        // For each possible x position at this y level
        for (let x = 0; x <= stock.length - pieceLength; x++) {
          // Check if position is available
          if (isPositionAvailable(placedRectangles, stock, x, y, pieceLength, pieceWidth)) {
            // If we found a position that's higher up, use it
            if (y < bestY || (y === bestY && x < bestX)) {
              bestY = y;
              bestX = x;
              // If we found a position at the very top (y=0), no need to look further
              if (y === 0) {
                break;
              }
            }
          }
        }
        
        // If we found a position at this y-level, no need to check lower y values
        if (bestY === y) {
          break;
        }
      }

      // If we found a valid position
      if (bestY !== Infinity && bestX !== Infinity) {
        return {
          placed: true,
          x: bestX,
          y: bestY
        };
      }
      
      return { placed: false }; // No valid placement found
    };
        
    // Process each stock item by priority
    for (const stockWithMeta of selectedStockWithMeta) {
      const stock = stockWithMeta.stock;
      
      // Get the quantity of this stock type available
      const stockQuantity = stock.quantity || 1;
      
      // Try to use as many sheets of this stock as needed (up to the quantity available)
      for (let sheetIndex = 0; sheetIndex < stockQuantity; sheetIndex++) {
        // Skip using additional sheets if all pieces are already placed
        if (placedPieceIds.size === expandedPieces.length) {
          break;
        }
        
        // Check if there are still unplaced pieces
        const unplacedPieces = expandedPieces.filter(piece => !placedPieceIds.has(piece.id));
        if (unplacedPieces.length === 0) {
          break;
        }
        
        console.log(`Processing stock ${stock.description} sheet #${sheetIndex + 1} of ${stockQuantity}`);
        
        // Create a unique ID for this stock sheet instance
        const stockInstanceId = `${stock.id}-${sheetIndex}`;
        
        // Add area of this stock to total
        totalStockArea += stock.length * stock.width;
        
        // Track placed pieces for this specific sheet
        const placedRectangles: {x: number, y: number, length: number, width: number}[] = [];
        
        // Create a layout for this specific stock sheet
        const layout: PanelCuttingPlanLayout = {
          stockId: stock.id,
          stockInstanceId: stockInstanceId,
          sheetIndex: sheetIndex,
          placements: [],
          wastePercentage: 0 // Will calculate after placements
        };
        
        // Try to place each unplaced piece on this sheet
        for (const piece of unplacedPieces) {
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
            
          console.log(`Piece ${piece.id} - ${piece.name}: grain=${piece.grainDirection}, stock grain=${stock.grainDirection}`);
          console.log(`  mustRotateForGrain=${mustRotateForGrain}, canRotate=${canRotate}`);
          
          let placement = { placed: false };

          // First attempt: If must rotate for grain, try rotated placement
          if (mustRotateForGrain) {
            placement = tryPlaceFromTop(placedRectangles, stock, piece, piece.width, piece.length, true);
          } 
          
          // Second attempt: Try normal orientation if not already placed and rotation is not mandatory
          if (!placement.placed && !mustRotateForGrain) {
            placement = tryPlaceFromTop(placedRectangles, stock, piece, piece.length, piece.width, false);
          }
          
          // Third attempt: Try rotated if allowed and not already placed
          if (!placement.placed && canRotate && !mustRotateForGrain) {
            placement = tryPlaceFromTop(placedRectangles, stock, piece, piece.width, piece.length, true);
          }
          
          // If piece was successfully placed
          // Use type guard to narrow the type instead of checking properties directly
          if (placement.placed && 'x' in placement && 'y' in placement) {
            // Determine dimensions based on rotation
            const isRotated = 
              (mustRotateForGrain) || 
              (!mustRotateForGrain && !placement.placed && canRotate);
            
            const pieceLength = isRotated ? piece.width : piece.length;
            const pieceWidth = isRotated ? piece.length : piece.width;
            
            // Explicitly cast x and y to number or use their numeric value
            const x: number = placement.x as number;
            const y: number = placement.y as number;
            
            // Add to placed rectangles
            placedRectangles.push({
              x: x,
              y: y,
              length: pieceLength,
              width: pieceWidth
            });
            
            // Add to layout placements
            layout.placements.push({
              pieceId: piece.id,
              x: x,
              y: y,
              rotated: isRotated
            });
            
            // Mark piece as placed
            placedPieceIds.add(piece.id);
            
            console.log(`  Placed piece ${piece.id} at (${x},${y}) ${isRotated ? 'ROTATED' : ''} on sheet #${sheetIndex + 1}`);
          } else {
            console.log(`  Could not place piece ${piece.id} on this sheet #${sheetIndex + 1}`);
          }
        }
        
        // Calculate waste percentage for this layout
        let usedArea = 0;
        layout.placements.forEach(placement => {
          const piece = expandedPieces.find(p => p.id === placement.pieceId);
          if (piece) {
            const length = placement.rotated ? piece.width : piece.length;
            const width = placement.rotated ? piece.length : piece.width;
            usedArea += length * width;
          }
        });
        
        const stockArea = stock.length * stock.width;
        layout.wastePercentage = Math.round((1 - (usedArea / stockArea)) * 100);
        
        // Only add layouts that have placements
        if (layout.placements.length > 0) {
          layouts.push(layout);
        } else {
          // If no pieces were placed on this sheet, reduce the total stock area
          totalStockArea -= stock.length * stock.width;
        }
      }
    }
    
    // Check if there are unplaced pieces
    const unplacedPieces = expandedPieces.filter(piece => !placedPieceIds.has(piece.id));
    if (unplacedPieces.length > 0) {
      console.warn('Not all pieces could be placed:', unplacedPieces.length, 'pieces remaining');
    }
    
    // Calculate overall waste percentage
    let totalUsedArea = 0;
    console.log('Layout count:', layouts.length);
    layouts.forEach(layout => {
      layout.placements.forEach(placement => {
        const expandedPiece = expandedPieces.find(c => c.id === placement.pieceId);
        if (expandedPiece) {
          const length = placement.rotated ? expandedPiece.width : expandedPiece.length;
          const width = placement.rotated ? expandedPiece.length : expandedPiece.width;
          totalUsedArea += length * width;
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
      // Store unplaced pieces to indicate which ones didn't fit
      unplacedPieceIds: Array.from(unplacedPieces.map(p => p.id)),
      layouts,
      wastagePercentage,
      notes: notes || '',
      kerfSize: kerfSize
    };
    
    setGeneratedPlan(cuttingPlan);
    setShowVisualization(true);
    setError('');
    
    // Show a warning if there are unplaced pieces
    if (unplacedPieces.length > 0) {
      setError(`Warning: ${unplacedPieces.length} pieces could not be placed on the available stock.`);
    }
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

      // Check if we're updating an existing plan
      if (editingPlanId) {
        // Update the existing plan
        const updatedPlan = {
          ...generatedPlan,
          id: editingPlanId,
          updatedDate: new Date(),
          name: planName || generatedPlan.name
        };
        
        // Find and replace the old plan
        const planIndex = savedPlans.findIndex(plan => plan.id === editingPlanId);
        if (planIndex !== -1) {
          savedPlans[planIndex] = updatedPlan;
        } else {
          // If somehow the plan doesn't exist anymore, just add it
          savedPlans.push(updatedPlan);
        }
        
        // Clear editing mode
        setEditingPlanId(null);
        
        // Update URL to remove query parameter
        navigate('/panel/create', { replace: true });
      } else {
        // Create a new plan
        const newPlan = {
          ...generatedPlan,
          name: planName || `Plan ${new Date().toLocaleDateString()}`
        };
        
        // Add the new plan
        savedPlans.push(newPlan);
      }
      
      // Save to cookie
      Cookies.set('savedPanelCuttingPlans', JSON.stringify(savedPlans), { expires: 365 });
      
      // Update local state
      setSavedPlans(savedPlans);
      
      // Reset form for new plan
      setPlanName('');
      setNotes('');
      
      alert(`Cutting plan ${editingPlanId ? 'updated' : 'saved'} successfully!`);
    } catch (err) {
      console.error('Error saving cutting plan:', err);
      alert(`Failed to ${editingPlanId ? 'update' : 'save'} cutting plan.`);
    }
  };

  // Handle loading a saved plan for editing
  const handleLoadPlan = (plan: PanelCuttingPlan) => {
    setPlanName(plan.name);
    setNotes(plan.notes || '');
    setKerfSize(plan.kerfSize || 3); // Add default value of 3 if kerfSize is undefined
    setSelectedStockItems(plan.selectedStock);
    setRequiredPieces(plan.requiredPieces);
    setGeneratedPlan(plan);
    
    // Automatically open the visualization for the loaded plan
    setShowVisualization(true);
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
                      <TableCell>{formatDimensionValue(stock.stock.thickness, "thickness", units)}</TableCell>
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
                    <TableCell colSpan={8} align="center">
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
                  headerName: `Length (${units})`, 
                  width: 120,
                  type: 'number',
                  renderCell: (params) => {
                    const value = params.row.length;
                    if (!useMetric) {
                      const displayValue = convertFromMetric(value, units);
                      return `${formatDimensionValue(displayValue, 'length', units)}`;
                    } else {
                      return Math.round(value);
                    }
                  }
                },
                { 
                  field: 'width', 
                  headerName: `Width (${units})`, 
                  width: 120,
                  type: 'number',
                  renderCell: (params) => {
                    const value = params.row.width;
                    if (!useMetric) {
                      const displayValue = convertFromMetric(value, units);
                      return `${formatDimensionValue(displayValue, 'width', units)}`;
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
            const layoutPieces = generatedPlan.expandedPieces?.filter(
              (p: PanelPiece) => layout.placements.some(placement => placement.pieceId === p.id)
            ) || [];
            
            // Create a descriptive sheet name that includes the sheet index if available
            const sheetLabel = layout.sheetIndex !== undefined 
              ? `Sheet #${layout.sheetIndex + 1}` 
              : '';
            
            return (
              <Box key={layout.stockInstanceId || `${layout.stockId}-default`} sx={{ mt: 3, mb: 5, border: '1px solid #ccc', padding: 2 }}>
                <Typography variant="h6">
                  Stock: {stockItem.description} {sheetLabel} ({formatDimensionValue(stockItem.length, 'length', units)} x {formatDimensionValue(stockItem.width, 'width', units)}) {stockItem.grainDirection}
                </Typography>
                <Typography variant="body2">
                  Wastage for this sheet: {layout.wastePercentage}%
                </Typography>
                <Box sx={{ mt: 2, overflow: 'auto' }}>
                  <PanelCuttingVisualizer 
                    stock={stockItem}
                    pieces={layoutPieces}
                    layout={layout}
                    unit={units}
                    kerfSize={kerfSize}
                  />
                </Box>
              </Box>
            );
          })}
          
          {/* Display warning about unplaced pieces if any */}
          {generatedPlan.unplacedPieceIds && generatedPlan.unplacedPieceIds.length > 0 && (
            <Box sx={{ mt: 3, mb: 3, p: 2, bgcolor: '#fff4e5', borderRadius: 1, border: '1px solid #ffab40' }}>
              <Typography variant="subtitle1" color="warning.dark">
                <strong>Warning:</strong> {generatedPlan.unplacedPieceIds.length} pieces could not be placed on the available stock.
              </Typography>
              <Typography variant="body2">
                Consider adding more stock sheets or adjusting your piece dimensions.
              </Typography>
            </Box>
          )}
          
          {/* Display if no layouts could be generated */}
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