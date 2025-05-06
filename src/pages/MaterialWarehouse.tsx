import React from 'react';
import { TabPanelProps } from '../interfaces/TabPanelProps';
import { PanelStock } from '../interfaces/PanelStock';
import { PanelStockFormData } from '../interfaces/PanelStockFormData';
import { MaterialWarehouseProps } from '../interfaces/MaterialWarehouseProps';
import AddPanelDialog from '../components/AddPanelDialog';
import {
  Paper,
  Typography,
  Container,
  Tabs,
  Tab,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Cookies from 'js-cookie';
import { WoodSpecies } from '../enums/WoodSpecies';
import { convertToMetric, convertFromMetric } from '../utils/unitConversion';
import { formatDimensionValue, formatImperialFraction } from '../utils/formatters';

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`material-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MaterialWarehouse: React.FC<MaterialWarehouseProps> = ({ units }) => {
  const [tabValue, setTabValue] = React.useState(0);
  const [panelStockRows, setPanelStockRows] = React.useState<PanelStock[]>(() => {
    try {
      const savedPanelStock = Cookies.get('panelStock');
      if (!savedPanelStock) return [];
      const parsed = JSON.parse(savedPanelStock);
      return parsed.map((item: any) => ({
        ...item,
        length: Number(item.length),
        width: Number(item.width),
        thickness: Number(item.thickness),
        quantity: Number(item.quantity),
        pricePer: Number(item.pricePer)
      }));
    } catch (e) {
      console.error('Error loading panel stock data:', e);
      return [];
    }
  });
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [formData, setFormData] = React.useState<PanelStockFormData>({
    length: 0,
    width: 0,
    thickness: 0,
    quantity: 0,
    grainDirection: 'N/A',
    woodSpecies: '',
    description: '',
    pricePer: 0
  });
  const [woodSpeciesOptions, setWoodSpeciesOptions] = React.useState<string[]>(Object.values(WoodSpecies));

  const handleAddClick = () => {
    setFormData({
      length: 0,
      width: 0,
      thickness: 0,
      quantity: 0,
      grainDirection: 'N/A',
      woodSpecies: '',
      description: '',
      pricePer: 0
    });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (id: number) => {
    const item = panelStockRows.find(row => row.id === id);
    if (item) {
      // No need to convert here - all data in panelStockRows is already in mm
      // The AddPanelDialog will handle conversion for display if needed
      setFormData(item);
      setEditingId(id);
      setIsDialogOpen(true);
    }
  };

  const handleDeleteClick = (id: number) => {
    setPanelStockRows(rows => rows.filter(row => row.id !== id));
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setFormData({
      length: 0,
      width: 0,
      thickness: 0,
      quantity: 0,
      grainDirection: 'N/A',
      woodSpecies: '',
      description: '',
      pricePer: 0
    });
    setEditingId(null);
  };

  const handleSubmit = (submittedData: PanelStockFormData) => {
    const processedFormData = {
      ...submittedData,
      length: convertToMetric(Number(submittedData.length), units) || 0,
      width: convertToMetric(Number(submittedData.width), units) || 0,
      thickness: convertToMetric(Number(submittedData.thickness), units) || 0,
      quantity: Number(submittedData.quantity) || 0,
      pricePer: Number(submittedData.pricePer) || 0
    };

    if (editingId !== null) {
      setPanelStockRows(rows =>
        rows.map(row =>
          row.id === editingId ? { ...processedFormData, id: editingId } : row
        )
      );
    } else {
      const newId = panelStockRows.length === 0 ? 1 : Math.max(...panelStockRows.map(row => row.id)) + 1;
      setPanelStockRows(rows => [...rows, { ...processedFormData, id: newId }]);
    }
    handleDialogClose();
  };

  const panelStockColumns: GridColDef[] = React.useMemo(() => [
    { 
      field: 'length', 
      headerName: `Length (${units})`, 
      width: 140,
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
      width: 140,
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
      field: 'thickness', 
      headerName: `Thickness (${units})`, 
      width: 140,
      type: 'number',
      renderCell: (params) => {
        const value = params.row.thickness;
        if (units === 'in') {
          const displayValue = convertFromMetric(value, 'in');
          return `${formatImperialFraction(displayValue)}`;
        } else {
          return Math.round(value);
        }
      }
    },
    { 
      field: 'quantity', 
      headerName: 'Quantity', 
      width: 100,
      type: 'number'
    },
    { 
      field: 'grainDirection',
      headerName: 'Grain Direction',
      width: 130
    },
    { 
      field: 'woodSpecies', 
      headerName: 'Wood Species', 
      width: 130
    },
    { 
      field: 'description', 
      headerName: 'Description', 
      width: 200,
      flex: 1
    },
    { 
      field: 'pricePer',
      headerName: 'Price Per',
      width: 110,
      type: 'number',
      renderCell: (params) => {
        const value = params.row.pricePer;
        return value ? `$${Number(value).toFixed(2)}` : '';
      }
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditClick(params.id as number)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteClick(params.id as number)}
        />,
      ],
    }
  ], [units]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  React.useEffect(() => {
    Cookies.set('panelStock', JSON.stringify(panelStockRows), { expires: 365 });
  }, [panelStockRows]);

  // Debug: Log panelStockRows to verify data
  React.useEffect(() => {
    console.log('panelStockRows', panelStockRows);
  }, [panelStockRows]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Wood" />
            <Tab label="Metal" />
            <Tab label="Other" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Panel Stock</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddClick}
                >
                  Add Panel
                </Button>
              </Box>
              <div style={{ height: 400, width: '100%', overflow: 'hidden' }}>
                <DataGrid
                  rows={panelStockRows}
                  columns={panelStockColumns}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 5 },
                    },
                  }}
                  pageSizeOptions={[5, 10, 20]}
                  disableRowSelectionOnClick
                  autoHeight
                  getRowId={(row) => row.id}
                  sortingMode="client"
                  density="standard"
                />
              </div>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Linear Stock</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText primary="No linear stock items added yet" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Edge Banding</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText primary="No edge banding items added yet" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Bar</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText primary="No bar stock items added yet" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Round</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText primary="No round stock items added yet" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Plate</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText primary="No plate items added yet" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Other</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText primary="No other metal items added yet" />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="body1" sx={{ p: 2 }}>
            No other materials added yet
          </Typography>
        </TabPanel>

        <AddPanelDialog
          open={isDialogOpen}
          onClose={handleDialogClose}
          onSubmit={handleSubmit}
          editingId={editingId}
          initialData={formData}
          units={units}
          woodSpeciesOptions={woodSpeciesOptions}
          setWoodSpeciesOptions={setWoodSpeciesOptions}
        />
      </Paper>
    </Container>
  );
};

export default MaterialWarehouse;