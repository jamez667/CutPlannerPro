import React from 'react';
import { TabPanelProps } from '../interfaces/TabPanelProps';
import { PanelStock } from '../interfaces/PanelStock';
import { PanelStockFormData } from '../interfaces/PanelStockFormData';
import { LinearStock } from '../interfaces/LinearStock';
import { LinearStockFormData } from '../interfaces/LinearStockFormData';
import { MaterialWarehouseProps } from '../interfaces/MaterialWarehouseProps';
import AddPanelDialog from '../components/AddPanelDialog';
import AddLinearDialog from '../components/AddLinearDialog';
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
  // Panel stock state
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
  const [isPanelDialogOpen, setIsPanelDialogOpen] = React.useState(false);
  const [panelEditingId, setPanelEditingId] = React.useState<number | null>(null);
  const [panelFormData, setPanelFormData] = React.useState<PanelStockFormData>({
    length: 0,
    width: 0,
    thickness: 0,
    quantity: 0,
    grainDirection: 'N/A',
    woodSpecies: '',
    description: '',
    pricePer: 0
  });
  
  // Linear stock state
  const [linearStockRows, setLinearStockRows] = React.useState<LinearStock[]>(() => {
    try {
      const savedLinearStock = Cookies.get('linearStock');
      if (!savedLinearStock) return [];
      const parsed = JSON.parse(savedLinearStock);
      return parsed.map((item: any) => ({
        ...item,
        length: Number(item.length),
        quantity: Number(item.quantity),
        pricePer: Number(item.pricePer)
      }));
    } catch (e) {
      console.error('Error loading linear stock data:', e);
      return [];
    }
  });
  const [isLinearDialogOpen, setIsLinearDialogOpen] = React.useState(false);
  const [linearEditingId, setLinearEditingId] = React.useState<number | null>(null);
  const [linearFormData, setLinearFormData] = React.useState<LinearStockFormData>({
    length: 0,
    quantity: 0,
    woodSpecies: '',
    description: '',
    pricePer: 0
  });
  
  // Shared state
  const [woodSpeciesOptions, setWoodSpeciesOptions] = React.useState<string[]>(Object.values(WoodSpecies));

  // Panel stock handlers
  const handlePanelAddClick = () => {
    setPanelFormData({
      length: 0,
      width: 0,
      thickness: 0,
      quantity: 0,
      grainDirection: 'N/A',
      woodSpecies: '',
      description: '',
      pricePer: 0
    });
    setPanelEditingId(null);
    setIsPanelDialogOpen(true);
  };

  const handlePanelEditClick = (id: number) => {
    const item = panelStockRows.find(row => row.id === id);
    if (item) {
      setPanelFormData(item);
      setPanelEditingId(id);
      setIsPanelDialogOpen(true);
    }
  };

  const handlePanelDeleteClick = (id: number) => {
    setPanelStockRows(rows => rows.filter(row => row.id !== id));
  };

  const handlePanelDialogClose = () => {
    setIsPanelDialogOpen(false);
    setPanelFormData({
      length: 0,
      width: 0,
      thickness: 0,
      quantity: 0,
      grainDirection: 'N/A',
      woodSpecies: '',
      description: '',
      pricePer: 0
    });
    setPanelEditingId(null);
  };

  const handlePanelSubmit = (submittedData: PanelStockFormData) => {
    const processedFormData = {
      ...submittedData,
      length: convertToMetric(Number(submittedData.length), units) || 0,
      width: convertToMetric(Number(submittedData.width), units) || 0,
      thickness: convertToMetric(Number(submittedData.thickness), units) || 0,
      quantity: Number(submittedData.quantity) || 0,
      pricePer: Number(submittedData.pricePer) || 0
    };

    if (panelEditingId !== null) {
      setPanelStockRows(rows =>
        rows.map(row =>
          row.id === panelEditingId ? { ...processedFormData, id: panelEditingId } : row
        )
      );
    } else {
      const newId = panelStockRows.length === 0 ? 1 : Math.max(...panelStockRows.map(row => row.id)) + 1;
      setPanelStockRows(rows => [...rows, { ...processedFormData, id: newId }]);
    }
    handlePanelDialogClose();
  };
  
  // Linear stock handlers
  const handleLinearAddClick = () => {
    setLinearFormData({
      length: 0,
      quantity: 0,
      woodSpecies: '',
      description: '',
      pricePer: 0
    });
    setLinearEditingId(null);
    setIsLinearDialogOpen(true);
  };

  const handleLinearEditClick = (id: number) => {
    const item = linearStockRows.find(row => row.id === id);
    if (item) {
      setLinearFormData(item);
      setLinearEditingId(id);
      setIsLinearDialogOpen(true);
    }
  };

  const handleLinearDeleteClick = (id: number) => {
    setLinearStockRows(rows => rows.filter(row => row.id !== id));
  };

  const handleLinearDialogClose = () => {
    setIsLinearDialogOpen(false);
    setLinearFormData({
      length: 0,
      quantity: 0,
      woodSpecies: '',
      description: '',
      pricePer: 0
    });
    setLinearEditingId(null);
  };

  const handleLinearSubmit = (submittedData: LinearStockFormData) => {
    const processedFormData = {
      ...submittedData,
      length: convertToMetric(Number(submittedData.length), units) || 0,
      quantity: Number(submittedData.quantity) || 0,
      pricePer: Number(submittedData.pricePer) || 0
    };

    if (linearEditingId !== null) {
      setLinearStockRows(rows =>
        rows.map(row =>
          row.id === linearEditingId ? { ...processedFormData, id: linearEditingId } : row
        )
      );
    } else {
      const newId = linearStockRows.length === 0 ? 1 : Math.max(...linearStockRows.map(row => row.id)) + 1;
      setLinearStockRows(rows => [...rows, { ...processedFormData, id: newId }]);
    }
    handleLinearDialogClose();
  };

  const panelStockColumns: GridColDef[] = React.useMemo(() => [
    { 
      field: 'length', 
      headerName: `Length (${units})`, 
      width: 140,
      type: 'number',
      renderCell: (params) => {
        const value = params.row.length;
        return `${formatDimensionValue(value, 'length', units)}`;
      }
    },
    { 
      field: 'width', 
      headerName: `Width (${units})`, 
      width: 140,
      type: 'number',
      renderCell: (params) => {
        const value = params.row.width;
        return `${formatDimensionValue(value, 'width', units)}`;
      }
    },
    { 
      field: 'thickness', 
      headerName: `Thickness (${units})`, 
      width: 140,
      type: 'number',
      renderCell: (params) => {
        const value = params.row.thickness;
        return `${formatDimensionValue(value, 'thickness', units)}`;
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
          onClick={() => handlePanelEditClick(params.id as number)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handlePanelDeleteClick(params.id as number)}
        />,
      ],
    }
  ], [units]);

  const linearStockColumns: GridColDef[] = React.useMemo(() => [
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
      field: 'quantity', 
      headerName: 'Quantity', 
      width: 100,
      type: 'number'
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
          onClick={() => handleLinearEditClick(params.id as number)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleLinearDeleteClick(params.id as number)}
        />,
      ],
    }
  ], [units]);

  // Save panel stock data to cookies
  React.useEffect(() => {
    Cookies.set('panelStock', JSON.stringify(panelStockRows), { expires: 365 });
  }, [panelStockRows]);
  
  // Save linear stock data to cookies
  React.useEffect(() => {
    Cookies.set('linearStock', JSON.stringify(linearStockRows), { expires: 365 });
  }, [linearStockRows]);

  // Debug logs
  React.useEffect(() => {
    console.log('panelStockRows', panelStockRows);
  }, [panelStockRows]);
  
  React.useEffect(() => {
    console.log('linearStockRows', linearStockRows);
  }, [linearStockRows]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2}>
        {/* Removing Metal and Other tabs, keeping only Wood tab */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={0}>
            <Tab label="Wood" />
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
                  onClick={handlePanelAddClick}
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
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleLinearAddClick}
                >
                  Add Linear Stock
                </Button>
              </Box>
              <div style={{ height: 400, width: '100%', overflow: 'hidden' }}>
                {linearStockRows.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                    <Typography variant="body2" color="text.secondary">
                      No linear stock items added yet. Click "Add Linear Stock" to add some.
                    </Typography>
                  </Box>
                ) : (
                  <DataGrid
                    rows={linearStockRows}
                    columns={linearStockColumns}
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
                )}
              </div>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        <AddPanelDialog
          open={isPanelDialogOpen}
          onClose={handlePanelDialogClose}
          onSubmit={handlePanelSubmit}
          editingId={panelEditingId}
          initialData={panelFormData}
          units={units}
          woodSpeciesOptions={woodSpeciesOptions}
          setWoodSpeciesOptions={setWoodSpeciesOptions}
        />
        
        <AddLinearDialog
          open={isLinearDialogOpen}
          onClose={handleLinearDialogClose}
          onSubmit={handleLinearSubmit}
          editingId={linearEditingId}
          initialData={linearFormData}
          units={units}
          woodSpeciesOptions={woodSpeciesOptions}
          setWoodSpeciesOptions={setWoodSpeciesOptions}
        />
      </Paper>
    </Container>
  );
};

export default MaterialWarehouse;