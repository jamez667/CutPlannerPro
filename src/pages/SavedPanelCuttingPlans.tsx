import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { PanelCuttingPlan } from '../interfaces/PanelCuttingPlan';
import PanelCuttingVisualizer from '../components/PanelCuttingVisualizer';
import Cookies from 'js-cookie';
import { formatDimensionValue } from '../utils/formatters';
import { RequiresUnitsProps } from '../interfaces/RequiresUnitsProps';
import { useNavigate } from 'react-router-dom';
import { convertFromMetric } from '../utils/unitConversion';

const SavedPanelCuttingPlans: React.FC<RequiresUnitsProps> = ({ units }) => {
  // State for saved cutting plans
  const [savedPlans, setSavedPlans] = useState<PanelCuttingPlan[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  const [selectedPlanForView, setSelectedPlanForView] = useState<PanelCuttingPlan | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [useMetric, setUseMetric] = useState<boolean>(units === 'mm');
  const navigate = useNavigate();
  
  // Load saved cutting plans from cookies on component mount
  useEffect(() => {
    try {
      const savedPanelPlans = Cookies.get('savedPanelCuttingPlans'); // Updated cookie name to match
      if (savedPanelPlans) {
        const parsed = JSON.parse(savedPanelPlans);
        // Convert date strings back to Date objects
        const plans = parsed.map((plan: any) => ({
          ...plan,
          createdDate: new Date(plan.createdDate),
          updatedDate: new Date(plan.updatedDate),
        }));
        setSavedPlans(plans);
      }
    } catch (e) {
      console.error('Error loading saved panel cutting plans:', e);
    }
  }, []);
  
  // Handle plan deletion
  const handleDeletePlan = (planId: number) => {
    setPlanToDelete(planId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeletePlan = () => {
    if (planToDelete !== null) {
      const updatedPlans = savedPlans.filter(plan => plan.id !== planToDelete);
      setSavedPlans(updatedPlans);
      
      // Update cookie
      Cookies.set('savedPanelCuttingPlans', JSON.stringify(updatedPlans), { expires: 365 }); // Updated cookie name
    }
    setDeleteDialogOpen(false);
    setPlanToDelete(null);
  };
  
  const cancelDeletePlan = () => {
    setDeleteDialogOpen(false);
    setPlanToDelete(null);
  };
  
  // View plan details
  const handleViewPlan = (planId: number) => {
    const plan = savedPlans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlanForView(plan);
      setViewDialogOpen(true);
    }
  };
  
  // Edit plan
  const handleEditPlan = (planId: number) => {
    navigate(`/panel/create?loadPlan=${planId}`);
  };
  
  // Close view dialog
  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedPlanForView(null);
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Saved Panel Cutting Plans</Typography>
        
        {savedPlans.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Updated Date</TableCell>
                  <TableCell>Stock Used</TableCell>
                  <TableCell>Wastage</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {savedPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{formatDate(plan.createdDate)}</TableCell>
                    <TableCell>{formatDate(plan.updatedDate)}</TableCell>
                    <TableCell>
                      {plan.selectedStock.map((stock, idx) => (
                        <div key={idx}>
                          {stock.stock.description} ({formatDimensionValue(stock.stock.length, 'length', units)} x {formatDimensionValue(stock.stock.width, 'width', units)} {units})
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>{plan.wastagePercentage}%</TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleViewPlan(plan.id)}
                        aria-label="view"
                        title="View Plan"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleEditPlan(plan.id)}
                        aria-label="edit"
                        title="Edit Plan"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeletePlan(plan.id)}
                        aria-label="delete"
                        title="Delete Plan"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center', 
            py: 5 
          }}>
            <Typography variant="h6" align="center" color="text.secondary">
              No saved panel cutting plans found
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary" sx={{ mt: 2 }}>
              Create and save a panel cutting plan to see it listed here
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              sx={{ mt: 3 }}
              onClick={() => navigate('/panel/create')}
            >
              Create New Panel Cutting Plan
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeletePlan}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Panel Cutting Plan?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this panel cutting plan? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeletePlan}>Cancel</Button>
          <Button onClick={confirmDeletePlan} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Plan Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedPlanForView?.name || 'Cutting Plan'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedPlanForView && (
            <Box>
              <Typography variant="h6">Plan Details</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Created:</strong> {formatDate(selectedPlanForView.createdDate)} | 
                  <strong> Material Utilization:</strong> {100 - selectedPlanForView.wastagePercentage}% | 
                  <strong> Wastage:</strong> {selectedPlanForView.wastagePercentage}%
                </Typography>
                {selectedPlanForView.notes && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Notes:</strong> {selectedPlanForView.notes}
                  </Typography>
                )}
              </Box>
              
              <Typography variant="h6" sx={{ mt: 3 }}>Required Pieces</Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Length</TableCell>
                      <TableCell>Width</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Grain Direction</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPlanForView.requiredPieces.map((piece, index) => (
                      <TableRow key={index}>
                        <TableCell>{piece.name}</TableCell>
                        <TableCell>{formatDimensionValue(piece.length, 'length', units)}</TableCell>
                        <TableCell>{formatDimensionValue(piece.width, 'width', units)}</TableCell>
                        <TableCell>{piece.quantity}</TableCell>
                        <TableCell>{piece.grainDirection}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="h6">Cutting Layouts</Typography>
              {selectedPlanForView.layouts.map((layout) => {
                const stockItem = selectedPlanForView.selectedStock.find(item => 
                  item.stock.id === layout.stockId
                )?.stock;
                
                if (!stockItem) return null;
                
                const layoutPieces = selectedPlanForView.expandedPieces?.filter(
                  (p) => layout.placements.some(placement => placement.pieceId === p.id)
                ) || [];
                
                return (
                  <Box key={layout.stockId} sx={{ mt: 3, mb: 3, border: '1px solid #ccc', padding: 2 }}>
                    <Typography variant="subtitle1">
                      Stock: {stockItem.description} ({formatDimensionValue(stockItem.length, 'length', units)} x {formatDimensionValue(stockItem.width, 'width', units)} {units}) {stockItem.grainDirection}
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
                        kerfSize={selectedPlanForView.kerfSize || 3}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleEditPlan(selectedPlanForView?.id || 0)} color="primary">
            Edit Plan
          </Button>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default SavedPanelCuttingPlans;