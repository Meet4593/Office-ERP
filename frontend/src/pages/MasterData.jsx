import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Button } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other} style={{ height: '100%' }}>
      {value === index && (
        <Box sx={{ pt: 3, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const departmentsColumns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Department Name', flex: 1, editable: true },
];

const itemsColumns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Item Name', flex: 1, editable: true },
  { field: 'description', headerName: 'Description', flex: 1, editable: true },
];

const suppliersColumns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Supplier Name', flex: 1, editable: true },
  { field: 'contact', headerName: 'Contact', width: 150, editable: true },
  { field: 'email', headerName: 'Email', width: 200, editable: true },
];

// Mock data
const initialDepartments = [
  { id: 1, name: 'IT Support' },
  { id: 2, name: 'Maintenance' },
];
const initialItems = [
  { id: 1, name: 'Printer Toner', description: 'Black toner cartridge' },
  { id: 2, name: 'Office Chair', description: 'Ergonomic chair' },
];

export default function MasterData() {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Master Data Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add New Record
        </Button>
      </Box>

      <Paper sx={{ width: '100%', mb: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Departments" />
            <Tab label="Items" />
            <Tab label="Suppliers" />
            <Tab label="Customers" />
            <Tab label="Machines" />
            <Tab label="Units" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabIndex} index={0}>
          <DataGrid
            rows={initialDepartments}
            columns={departmentsColumns}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
            sx={{ border: 0 }}
          />
        </TabPanel>
        
        <TabPanel value={tabIndex} index={1}>
          <DataGrid
            rows={initialItems}
            columns={itemsColumns}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: { showQuickFilter: true },
            }}
            sx={{ border: 0 }}
          />
        </TabPanel>
        
        <TabPanel value={tabIndex} index={2}>
          <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
            Supplier data grid goes here...
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
}
