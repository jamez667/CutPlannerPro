import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';
import GridOnIcon from '@mui/icons-material/GridOn';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalculatorIcon from '@mui/icons-material/Calculate';
import { Select, MenuItem, IconButton, Avatar, AppBar, Toolbar, Typography, SelectChangeEvent } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import StraightenIcon from '@mui/icons-material/Straighten';
import MaterialWarehouse from './pages/MaterialWarehouse';
import SavedPanelCuttingPlans from './pages/SavedPanelCuttingPlans';
import PanelCuttingPlans from './pages/PanelCuttingPlans';
import Cookies from 'js-cookie';

const App: React.FC = () => {
  const [units, setUnits] = React.useState(() => Cookies.get('units') || 'metric');
  const [language, setLanguage] = React.useState(Cookies.get('language') || 'en');

  const handleUnitsChange = (e: SelectChangeEvent) => {
    const newUnits = e.target.value;
    setUnits(newUnits);
    console.log('Units changed to:', newUnits);
    Cookies.set('units', newUnits, { expires: 365 }); // Store for 1 year
  };

  const handleLanguageChange = (e: SelectChangeEvent) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    console.log('Language changed to:', newLanguage);
    Cookies.set('language', newLanguage, { expires: 365 }); // Store for 1 year
  };

  return (
    <BrowserRouter>
      <div className="App">
        <AppBar position="fixed" className="app-header" color="default">
          <Toolbar>
            <Typography variant="h6" className="app-title">
              CutPlanner Pro
            </Typography>
            <div className="header-controls">
              <div className="control-item">
                <StraightenIcon />
                <Select
                  value={units}
                  onChange={handleUnitsChange}
                  size="small"
                >
                  <MenuItem value="mm">Metric (mm)</MenuItem>
                  <MenuItem value="in">Imperial (in)</MenuItem>
                </Select>
              </div>
              <div className="control-item">
                <LanguageIcon />
                <Select
                  value={language}
                  onChange={handleLanguageChange}
                  size="small"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                </Select>
              </div>
              <IconButton>
                <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
              </IconButton>
            </div>
          </Toolbar>
        </AppBar>
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <section className="nav-section">
              <h3>Linear Cutting Plans</h3>
              <ul>
                <li>
                  <Link to="/linear/create">
                    <AddCircleOutlineIcon className="nav-icon" />
                    Create New Plan
                  </Link>
                </li>
                <li>
                  <Link to="/linear/saved">
                    <ViewTimelineIcon className="nav-icon" />
                    Saved Plans
                  </Link>
                </li>
              </ul>
            </section>
            <section className="nav-section">
              <h3>Panel Cutting Plans</h3>
              <ul>
                <li>
                  <Link to="/panel/create">
                    <AddCircleOutlineIcon className="nav-icon" />
                    Create New Plan
                  </Link>
                </li>
                <li>
                  <Link to="/panel/saved">
                    <GridOnIcon className="nav-icon" />
                    Saved Plans
                  </Link>
                </li>
              </ul>
            </section>
            <section className="nav-section">
              <h3>Tools</h3>
              <ul>
                <li>
                  <Link to="/material-warehouse">
                    <InventoryIcon className="nav-icon" />
                    Stock
                  </Link>
                  <Link to="/calc-linearfeet">
                    <CalculatorIcon className="nav-icon" />
                    Calculator - Linear Feet
                  </Link>
                </li>
              </ul>
            </section>
          </nav>
        </aside>
        <main className="main-content">
          <div className="content-wrapper">
            <Routes>
              <Route path="/material-warehouse" element={<MaterialWarehouse key={units} units={units} />} />
              <Route path="/panel/saved" element={<SavedPanelCuttingPlans units={units === 'metric' ? 'mm' : 'in'} />} />
              <Route path="/panel/create" element={<PanelCuttingPlans units={units === 'metric' ? 'mm' : 'in'} />} />
              <Route path="/" element={
                <>
                  <h1>CutPlanner Pro</h1>
                  <p>Welcome to CutPlanner Pro</p>
                </>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;