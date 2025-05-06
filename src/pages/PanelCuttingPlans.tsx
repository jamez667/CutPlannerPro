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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { PanelStock } from '../interfaces/PanelStock';
import { PanelCut } from '../interfaces/PanelCut';
import { PanelCuttingPlan } from '../interfaces/PanelCuttingPlan';
import AddPanelCutDialog from '../components/AddPanelCutDialog';
// Import temporarily commented out
// import PanelCuttingVisualizer from '../components/PanelCuttingVisualizer';
import { convertFromMetric, convertToMetric } from '../utils/unitConversion';
import { formatDimensionValue, formatImperialFraction } from '../utils/formatters';
import Cookies from 'js-cookie';

interface PanelCuttingPlansProps {
  units: 'in' | 'mm';
}

const PanelCuttingPlans: React.FC<PanelCuttingPlansProps> = ({ units }) => {
  // State for available stock (from warehouse)
  const [availableStock, setAvailableStock] = useState<PanelStock[]>([]);
  
  // State for selected stock
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  
  // State for cuts needed
  const [cutsList, setCutsList] = useState<PanelCut[]>([]);
  
  // State for cut dialog
  const [isCutDialogOpen, setIsCutDialogOpen] = useState(false);
  const [cutEditingId, setCutEditingId] = useState<number | null>(null);
  
  // State for cutting plan
  const [cuttingPlan, setCuttingPlan] = useState<PanelCuttingPlan | null>(null);

  // Load panel stock from cookies on component mount
  useEffect(() => {
    try {
      const savedPanelStock = Cookies.get('panelStock');
      if (savedPanelStock) {
        const parsed = JSON.parse(savedPanelStock);
        setAvailableStock(parsed.map((item: any) => ({
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
  const handleStockSelect = (event: any) => {
    setSelectedStockId(event.target.value);
    // Reset cuts and cutting plan when stock changes
    setCutsList([]);
    setCuttingPlan(null);
  };

  // Get selected stock details
  const selectedStock = selectedStockId 
    ? availableStock.find(stock => stock.id === selectedStockId) 
    : null;

  // Handle opening the add cut dialog
  const handleAddCutClick = () => {
    setCutEditingId(null);
    setIsCutDialogOpen(true);
  };

  // Handle editing a cut
  const handleEditCut = (id: number) => {
    setCutEditingId(id);
    setIsCutDialogOpen(true);
  };

  // Handle deleting a cut
  const handleDeleteCut = (id: number) => {
    setCutsList(cuts => cuts.filter(cut => cut.id !== id));
  };

  // Handle closing the cut dialog
  const handleCutDialogClose = () => {
    setIsCutDialogOpen(false);
    setCutEditingId(null);
  };

  // Handle submitting a cut
  const handleCutSubmit = (cutData: Omit<PanelCut, 'id'>) => {
    if (cutEditingId !== null) {
      setCutsList(cuts => 
        cuts.map(cut => 
          cut.id === cutEditingId ? { ...cutData, id: cutEditingId } : cut
        )
      );
    } else {
      const newId = cutsList.length === 0 ? 1 : Math.max(...cutsList.map(cut => cut.id)) + 1;
      setCutsList(cuts => [...cuts, { ...cutData, id: newId }]);
    }
    setIsCutDialogOpen(false);
  };

  // Generate cutting plan
  const generateCuttingPlan = () => {
    if (!selectedStock || cutsList.length === 0) return;

    // In a real application, you would implement a more sophisticated algorithm here
    // For now, we'll create a simple demonstration plan
    
    // Convert to metric for calculations
    const stockLength = selectedStock.length;
    const stockWidth = selectedStock.width;
    
    const simplePlan: PanelCuttingPlan = {
      id: Date.now(), // Generate a unique ID based on current timestamp
      name: `Plan for ${selectedStock.description || 'Untitled Stock'}`,
      createdDate: new Date(),
      updatedDate: new Date(),
      selectedStock: [selectedStock],
      requiredCuts: [...cutsList],
      layouts: [{
        stockId: selectedStock.id,
        cuts: cutsList.map(cut => ({
          cutId: cut.id,
          x: 0, // These will be calculated by a real algorithm
          y: 0, // These will be calculated by a real algorithm
          rotated: false // Indicates if piece is rotated 90 degrees
        }))
      }],
      wastagePercentage: 0, // Will be calculated by the real algorithm
      notes: ''
    };
    
    // Calculate positions for cuts (simplified version)
    // This is a placeholder - a real algorithm would optimize positions
    let currentX = 0;
    let currentY = 0;
    let rowMaxHeight = 0;
    
    simplePlan.layouts[0].cuts = simplePlan.layouts[0].cuts.map((cutLayout, index) => {
      const cut = cutsList.find(c => c.id === cutLayout.cutId)!;
      
      // Check if we need to move to the next row
      if (currentX + cut.length > stockLength) {
        currentX = 0;
        currentY += rowMaxHeight;
        rowMaxHeight = 0;
      }
      
      // Check if piece fits better rotated
      const rotated = (cut.width > cut.length) && 
                      (cut.width <= stockLength) && 
                      (cut.length <= stockWidth - currentY);
                      
      // Set position and update tracking variables
      const updatedCutLayout = {
        ...cutLayout,
        x: currentX,
        y: currentY,
        rotated
      };
      
      // Advance position tracker
      if (rotated) {
        currentX += cut.width;
        rowMaxHeight = Math.max(rowMaxHeight, cut.length);
      } else {
        currentX += cut.length;
        rowMaxHeight = Math.max(rowMaxHeight, cut.width);
      }
      
      return updatedCutLayout;
    });

    // Calculate waste percentage (simplified)
    const totalArea = stockLength * stockWidth;
    let usedArea = 0;
    
    simplePlan.layouts[0].cuts.forEach(cutLayout => {
      const cut = cutsList.find(c => c.id === cutLayout.cutId)!;
      usedArea += cut.length * cut.width;
    });
    
    simplePlan.wastagePercentage = Math.round(100 * (1 - usedArea / totalArea));
    
    setCuttingPlan(simplePlan);
  };

  // Columns for the cuts data grid
  const cutColumns: GridColDef[] = [
    {
      field: 'label',
      headerName: 'Label',
      width: 120
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 80,
      type: 'number'
    },
    { 
      field: 'length', 
      headerName: `Length (${units})`, 
      width: 120,
      type: 'number',
      renderCell: (params) => {
        const value = params.row.length;
        if (units === 'in') {
          const displayValue = convertFromMetric(value, 'in');
          return `${formatImperialFraction(displayValue)}`;
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
        if (units === 'in') {
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
          onClick={() => handleDeleteCut(params.id as number)}
        />,
      ],
    }
  ];

  // Format stock dimensions for display
  const formatStockDimension = (value: number) => {
    if (units === 'in') {
      const inValue = convertFromMetric(value, 'in');
      return formatImperialFraction(inValue);
    }
    return Math.round(value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Panel Cutting Plans</Typography>
        
        {/* Stock Selection */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Select Stock</Typography>
          <FormControl fullWidth>
            <InputLabel>Panel Stock</InputLabel>
            <Select
              value={selectedStockId || ''}
              onChange={handleStockSelect}
              label="Panel Stock"
            >
              {availableStock.map((stock) => (
                <MenuItem key={stock.id} value={stock.id}>
                  {stock.description} - {formatStockDimension(stock.length)} x {formatStockDimension(stock.width)} {units}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedStock && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                Selected Stock: {formatStockDimension(selectedStock.length)} x {formatStockDimension(selectedStock.width)} {units} {selectedStock.description}
              </Typography>
              <Typography variant="body2">
                Available Quantity: {selectedStock.quantity}
              </Typography>
            </Box>
          )}
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
              rows={cutsList}
              columns={cutColumns}
              pageSizeOptions={[5, 10]}
              disableRowSelectionOnClick
              getRowId={(row) => row.id}
            />
          </div>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={generateCuttingPlan}
              disabled={!selectedStock || cutsList.length === 0}
            >
              Generate Cutting Plan
            </Button>
          </Box>
        </Box>
        
        {/* Cutting Plan Results (without visualization) */}
        {cuttingPlan && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Cutting Plan Results</Typography>
            <Typography variant="body2" gutterBottom>
              Waste Percentage: {cuttingPlan.wastagePercentage}%
            </Typography>
            
            {/* Table of cuts with positions */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Cut Placement Details:</Typography>
              <div style={{ height: 300, width: '100%' }}>
                <DataGrid
                  rows={cuttingPlan.layouts[0].cuts}
                  columns={[
                    { field: 'cutId', headerName: 'Cut ID', width: 120 },
                    { 
                      field: 'x', 
                      headerName: `X Position (${units})`, 
                      width: 120,
                      renderCell: (params) => {
                        return formatStockDimension(params.row.x);
                      }
                    },
                    { 
                      field: 'y', 
                      headerName: `Y Position (${units})`, 
                      width: 120,
                      renderCell: (params) => {
                        return formatStockDimension(params.row.y);
                      }
                    },
                    { 
                      field: 'rotated', 
                      headerName: 'Rotated', 
                      width: 100,
                      type: 'boolean'
                    }
                  ]}
                  pageSizeOptions={[5, 10]}
                  disableRowSelectionOnClick
                  getRowId={(row) => row.cutId}
                />
              </div>
            </Box>
            
            {/* Placeholder message for visualization */}
            <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', textAlign: 'center' }}>
              <Typography variant="body1">
                Visual representation will be implemented in a future update.
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Add Cut Dialog */}
      <AddPanelCutDialog
        open={isCutDialogOpen}
        onClose={handleCutDialogClose}
        onAdd={handleCutSubmit}
        unit={units}
        nextId={cutsList.length === 0 ? 1 : Math.max(...cutsList.map(cut => cut.id)) + 1}
      />
    </Container>
  );
};

export default PanelCuttingPlans;