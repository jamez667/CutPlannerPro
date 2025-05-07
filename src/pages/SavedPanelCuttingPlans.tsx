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
import { PanelCuttingPlan } from '../interfaces/PanelCuttingPlan';
import Cookies from 'js-cookie';
import { formatDimensionValue } from '../utils/formatters';
import { RequiresUnitsProps } from '../interfaces/RequiresUnitsProps';

const SavedPanelCuttingPlans: React.FC<RequiresUnitsProps> = ({ units }) => {
  // State for saved cutting plans
  const [savedPlans, setSavedPlans] = useState<PanelCuttingPlan[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  
  // Load saved cutting plans from cookies on component mount
  useEffect(() => {
    try {
      const savedPanelPlans = Cookies.get('savedPanelPlans');
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
      Cookies.set('savedPanelPlans', JSON.stringify(updatedPlans), { expires: 365 });
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
    // In a real implementation, you would navigate to a detailed view page
    console.log(`View plan details for ID ${planId}`);
    // Could redirect to: navigate(`/panel/create?loadPlan=${planId}`);
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
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeletePlan(plan.id)}
                        aria-label="delete"
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
              href="/panel/create"
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
    </Container>
  );
}

export default SavedPanelCuttingPlans;