import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  PointOfSale as PointOfSaleIcon,
  Build as BuildIcon,
  Settings as SettingsIcon,
  Book as BookIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  LockReset as LockResetIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { changePassword } from '../services/api';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Purchase', icon: <ShoppingCartIcon />, path: '/purchase' },
  { text: 'Sales', icon: <PointOfSaleIcon />, path: '/sales' },
  { text: 'Services', icon: <BuildIcon />, path: '/services' },
  { text: 'Journal', icon: <BookIcon />, path: '/journal' },
  { text: 'Cash & Bank', icon: <AccountBalanceIcon />, path: '/vouchers' },
  { text: 'Master Data', icon: <SettingsIcon />, path: '/master' },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', newPass: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleOpenProfile = () => {
    handleClose();
    setProfileOpen(true);
  };

  const handleCloseProfile = () => {
    setProfileOpen(false);
  };

  const handleOpenPassword = () => setPasswordOpen(true);
  const handleClosePassword = () => {
    setPasswordOpen(false);
    setPassForm({ current: '', newPass: '' });
    setPassMsg({ type: '', text: '' });
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      setPassMsg({ type: '', text: '' });
      await changePassword(passForm.current, passForm.newPass);
      setPassMsg({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => {
        handleClosePassword();
      }, 1500);
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const getInitial = () => {
    if (user && user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        px: [1],
        py: 2,
        gap: 1
      }}>
        <img src="/logo.png" alt="Office ERP Pro Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Office ERP Pro
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, px: 2, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: '8px',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: '40px', 
                color: location.pathname === item.path ? 'inherit' : 'text.secondary' 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          v1.0.0 &copy; 2026 Office ERP Pro
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          borderBottom: '1px solid #e2e8f0',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <div>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2, fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
                {user?.name ? `Hi, ${user.name}` : ''}
              </Typography>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{ p: 0 }}
              >
                <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 'bold' }}>
                  {getInitial()}
                </Avatar>
              </IconButton>
            </Box>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{ mt: 1.5 }}
              PaperProps={{
                elevation: 3,
                sx: { width: 180, borderRadius: 2 }
              }}
            >
              <MenuItem onClick={handleOpenProfile} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <PersonIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <Typography variant="body1" fontWeight="500">Profile</Typography>
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body1" fontWeight="500" color="error">Logout</Typography>
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid #e2e8f0'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}
      >
        <Outlet />
      </Box>

      {/* Profile Dialog */}
      <Dialog open={profileOpen} onClose={handleCloseProfile} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pt: 3 }}>User Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, mt: 1 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem', mb: 2 }}>
              {getInitial()}
            </Avatar>
            <Typography variant="h5" fontWeight="bold">{user?.name || 'User'}</Typography>
            <Typography color="text.secondary" variant="body2">{user?.role || 'EMPLOYEE'}</Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonIcon sx={{ color: 'action.active', mr: 2 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">Full Name</Typography>
              <Typography variant="body1">{user?.name || 'N/A'}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EmailIcon sx={{ color: 'action.active', mr: 2 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">Email Address</Typography>
              <Typography variant="body1">{user?.email || 'N/A'}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BadgeIcon sx={{ color: 'action.active', mr: 2 }} />
            <Box>
              <Typography variant="caption" color="text.secondary">Role / Permission</Typography>
              <Typography variant="body1">{user?.role || 'N/A'}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: 'space-between', gap: 1 }}>
          <Button onClick={handleOpenPassword} variant="contained" color="secondary" startIcon={<LockResetIcon />} fullWidth>
            Change Password
          </Button>
          <Button onClick={handleCloseProfile} variant="outlined" fullWidth>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onClose={handleClosePassword} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Change Password</DialogTitle>
        <Box component="form" onSubmit={handlePasswordSubmit}>
          <DialogContent>
            {passMsg.text && (
              <Alert severity={passMsg.type} sx={{ mb: 2 }}>
                {passMsg.text}
              </Alert>
            )}
            <TextField
              fullWidth
              margin="dense"
              label="Current Password"
              type="password"
              required
              value={passForm.current}
              onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
            />
            <TextField
              fullWidth
              margin="dense"
              label="New Password"
              type="password"
              required
              sx={{ mt: 2 }}
              value={passForm.newPass}
              onChange={(e) => setPassForm({ ...passForm, newPass: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClosePassword} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">Update Password</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
