import React from 'react';
import { TabPanelProps } from '../interfaces/TabPanelProps';
import { PanelStock } from '../interfaces/PanelStock';
import { PanelStockFormData } from '../interfaces/PanelStockFormData';
import { LinearStock } from '../interfaces/LinearStock';
import { LinearStockFormData } from '../interfaces/LinearStockFormData';
import { RequiresUnitsProps } from '../interfaces/RequiresUnitsProps';
import { MaterialType, MaterialTypeItem } from '../interfaces/MaterialType';
import AddPanelDialog from '../components/AddPanelStockDialog';
import AddLinearDialog from '../components/AddLinearStockDialog';
import AddMaterialTypeDialog from '../components/AddMaterialTypeDialog';
import EditMaterialTypeDialog from '../components/EditMaterialTypeDialog';
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
  ListSubheader,
  Divider,
  Card,
  CardContent,
  Fab,
  Tooltip,
  Alert,
  Snackbar,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction
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
import { Dimension } from "../enums/Dimension";

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

const MaterialWarehouse: React.FC<RequiresUnitsProps> = ({ units }) => {
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

  // Material type state
  const [isMaterialTypeDialogOpen, setIsMaterialTypeDialogOpen] = React.useState(false);
  const [isEditMaterialTypeDialogOpen, setIsEditMaterialTypeDialogOpen] = React.useState(false);
  const [materialTypes, setMaterialTypes] = React.useState<MaterialType[]>(() => {
    try {
      const savedMaterialTypes = Cookies.get('materialTypes');
      if (savedMaterialTypes) {
        return JSON.parse(savedMaterialTypes);
      }
    } catch (e) {
      console.error('Error loading material types:', e);
    }
    
    // Default material types
    return [
      {
        category: "Wood",
        items: [
          {
            name: "North American & European Hardwoods",
            description: "Premium hardwoods native to North America and Europe, known for their durability and beauty",
            common: ["Oak", "Maple", "Cherry", "Walnut", "Mahogany", "Birch", "Hickory", "Ash", "Rosewood"]
          },
          {
            name: "Asian Hardwoods",
            description: "Exotic hardwoods from Asia, often featuring unique grain patterns and coloration",
            common: ["Teak", "Rosewood", "Merbau", "Rubberwood", "Burmese Blackwood", "Ramin"]
          },
          {
            name: "African Hardwoods",
            description: "Premium exotic hardwoods from Africa, often featuring distinctive colors and grain patterns",
            common: ["African Blackwood", "Zebrano (Zebrawood)", "Wenge", "Iroko", "Pink Ivory", "Afzelia"]
          },
          {
            name: "Softwood",
            description: "Derived from coniferous trees, generally less dense and easier to work with",
            common: ["Pine", "Cedar", "Spruce", "Fir", "Redwood", "Hemlock", "Douglas Fir", "Cypress"]
          },
          {
            name: "Plywood",
            description: "Engineered wood made from thin layers of wood veneer glued together with adjacent layers having their wood grain rotated",
            common: ["Birch", "Oak", "Marine", "Baltic Birch", "Sande", "Cabinet-Grade", "Structural", "CDX", "ACX", "BCX", "Hardwood", "Softwood", "Aircraft", "Exterior", "Interior", "WBP", "Lauan", "MR (Moisture Resistant)", "AB", "BB", "PureBond", "ApplePly", "Radiata Pine", "Okoume", "MDO"]
          },
          {
            name: "Engineered Wood",
            description: "Manufactured wood products composed of multiple layers or particles",
            common: ["MDF", "Particleboard", "OSB", "Hardboard", "Veneered Panels", "LVL (Laminated Veneer Lumber)", "Melamine"]
          }
        ]
      },
      {
        category: "Metal",
        items: [
          {
            name: "Ferrous Metals",
            description: "Metals containing iron, typically magnetic and prone to rust",
            common: ["Carbon Steel", "Stainless Steel", "Cast Iron", "Wrought Iron", "Tool Steel"]
          },
          {
            name: "Non-ferrous Metals",
            description: "Metals without significant iron content, usually non-magnetic and corrosion resistant",
            common: ["Aluminum", "Copper", "Brass", "Bronze", "Zinc"]
          },
          {
            name: "Precious Metals",
            description: "Rare metals with high economic value",
            common: ["Gold", "Silver", "Platinum", "Titanium"]
          }
        ]
      },
      {
        category: "Plastic",
        items: [
          {
            name: "Thermoplastics",
            description: "Plastics that can be melted and reformed multiple times",
            common: ["Acrylic (PMMA)", "Polycarbonate", "PVC", "Polyethylene", "Polypropylene"]
          },
          {
            name: "Thermosets",
            description: "Plastics that irreversibly cure, creating strong bonds resistant to heat",
            common: ["Epoxy", "Polyurethane", "Phenolic", "Melamine"]
          },
          {
            name: "Composites",
            description: "Materials made from two or more constituent materials with different properties",
            common: ["Fiberglass", "Carbon Fiber", "HDPE Composites"]
          }
        ]
      }
    ];
  });
  
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

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
      length: submittedData.length || 0,
      width: submittedData.width || 0,
      thickness: submittedData.thickness || 0,
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
      length: submittedData.length || 0,
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

  // Material type handlers
  const handleOpenMaterialTypeDialog = () => {
    setIsMaterialTypeDialogOpen(true);
  };

  const handleCloseMaterialTypeDialog = () => {
    setIsMaterialTypeDialogOpen(false);
  };

  const handleAddMaterialType = (newMaterialType: MaterialTypeItem, categoryName: string) => {
    const updatedMaterialTypes = [...materialTypes];
    
    // Check if the category exists
    const categoryIndex = updatedMaterialTypes.findIndex(
      category => category.category.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (categoryIndex >= 0) {
      // Category exists, add the new material type to it
      updatedMaterialTypes[categoryIndex].items.push(newMaterialType);
    } else {
      // Category doesn't exist, create a new one
      updatedMaterialTypes.push({
        category: categoryName,
        items: [newMaterialType]
      });
    }
    
    setMaterialTypes(updatedMaterialTypes);
    setSnackbarMessage(`Added new material type: ${newMaterialType.name}`);
    setSnackbarOpen(true);
    handleCloseMaterialTypeDialog();
  };

  const handleOpenEditMaterialTypeDialog = () => {
    setIsEditMaterialTypeDialogOpen(true);
  };

  const handleCloseEditMaterialTypeDialog = () => {
    setIsEditMaterialTypeDialogOpen(false);
  };

  const handleEditMaterialType = (
    updatedMaterialType: MaterialTypeItem,
    categoryName: string,
    originalName: string
  ) => {
    const updatedMaterialTypes = [...materialTypes];
    
    const categoryIndex = updatedMaterialTypes.findIndex(
      category => category.category === categoryName
    );
    
    if (categoryIndex >= 0) {
      const itemIndex = updatedMaterialTypes[categoryIndex].items.findIndex(
        item => item.name === originalName
      );
      
      if (itemIndex >= 0) {
        updatedMaterialTypes[categoryIndex].items[itemIndex] = updatedMaterialType;
        setMaterialTypes(updatedMaterialTypes);
        setSnackbarMessage(`Updated material type: ${updatedMaterialType.name}`);
        setSnackbarOpen(true);
      }
    }
    
    handleCloseEditMaterialTypeDialog();
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Save panel stock data to cookies
  React.useEffect(() => {
    Cookies.set('panelStock', JSON.stringify(panelStockRows), { expires: 365 });
  }, [panelStockRows]);
  
  // Save linear stock data to cookies
  React.useEffect(() => {
    Cookies.set('linearStock', JSON.stringify(linearStockRows), { expires: 365 });
  }, [linearStockRows]);

  // Save material types to cookies
  React.useEffect(() => {
    Cookies.set('materialTypes', JSON.stringify(materialTypes), { expires: 365 });
  }, [materialTypes]);

  // Debug logs
  React.useEffect(() => {
  }, [panelStockRows]);
  
  React.useEffect(() => {
  }, [linearStockRows]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={2}>
        {/* Removing Material tabs, keeping only Wood tab */}
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
                  columns={[
                    { 
                      field: 'length', 
                      headerName: `Length (${units})`, 
                      width: 140,
                      type: 'number',
                      renderCell: (params) => {
                        const value = params.row.length;
                        return `${formatDimensionValue(value, Dimension.LENGTH, units)}`;
                      }
                    },
                    { 
                      field: 'width', 
                      headerName: `Width (${units})`, 
                      width: 140,
                      type: 'number',
                      renderCell: (params) => {
                        const value = params.row.width;
                        return `${formatDimensionValue(value, Dimension.WIDTH, units)}`;
                      }
                    },
                    { 
                      field: 'thickness', 
                      headerName: `Thickness (${units})`, 
                      width: 140,
                      type: 'number',
                      renderCell: (params) => {
                        const value = params.row.thickness;
                        return `${formatDimensionValue(value, Dimension.THICKNESS, units)}`;
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
                  ]}
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
                    columns={[
                      { 
                        field: 'length', 
                        headerName: `Length (${units})`, 
                        width: 140,
                        type: 'number',
                        renderCell: (params) => {
                          return `${formatDimensionValue(params.row.length, Dimension.LENGTH, units)}`;
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
                    ]}
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

      {/* Material Types Reference Section */}
      <Paper elevation={2} sx={{ mt: 4, mb: 4, p: 2, position: 'relative' }}>
        <Typography variant="h5" gutterBottom sx={{ pb: 2 }}>
          Material Types Reference
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {materialTypes.map((material, idx) => (
          <Accordion key={idx}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{material.category}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List
                sx={{ width: '100%', bgcolor: 'background.paper' }}
                component="nav"
                aria-labelledby={`${material.category}-list`}
              >
                {material.items.map((item, itemIdx) => (
                  <React.Fragment key={itemIdx}>
                    <ListItem>
                      <Card sx={{ width: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {item.description}
                          </Typography>
                          <Typography variant="subtitle2">
                            Common Examples:
                          </Typography>
                          <Typography variant="body2">
                            {item.common.join(", ")}
                          </Typography>
                        </CardContent>
                      </Card>
                    </ListItem>
                    {itemIdx < material.items.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Replace FAB with SpeedDial */}
        <SpeedDial
          ariaLabel="Material Type Actions"
          sx={{ position: 'absolute', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<AddIcon />}
            tooltipTitle="Add New Material Type"
            onClick={handleOpenMaterialTypeDialog}
          />
          <SpeedDialAction
            icon={<EditIcon />}
            tooltipTitle="Edit Material Type"
            onClick={handleOpenEditMaterialTypeDialog}
          />
        </SpeedDial>
      </Paper>

      {/* Add Material Type Dialog */}
      <AddMaterialTypeDialog
        open={isMaterialTypeDialogOpen}
        onClose={handleCloseMaterialTypeDialog}
        onSubmit={handleAddMaterialType}
        existingCategories={materialTypes.map(m => m.category)}
      />
      
      {/* Edit Material Type Dialog */}
      <EditMaterialTypeDialog
        open={isEditMaterialTypeDialogOpen}
        onClose={handleCloseEditMaterialTypeDialog}
        onSubmit={handleEditMaterialType}
        materialTypes={materialTypes}
      />
      
      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MaterialWarehouse;