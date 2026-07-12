import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme,
  Badge,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EcoIcon from '@mui/icons-material/EnergySavingsLeaf';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/hooks/useSidebar';
import { APP_NAME, SIDEBAR_WIDTH, ROUTES } from '@/utils/constants';

const MAIN_NAV = [
  { path: ROUTES.DASHBOARD,     label: 'Dashboard',     icon: <DashboardIcon fontSize="small" /> },
  { path: ROUTES.ENVIRONMENTAL, label: 'Environmental', icon: <EcoIcon fontSize="small" /> },
  { path: ROUTES.SOCIAL,        label: 'Social',        icon: <GroupsIcon fontSize="small" /> },
  { path: ROUTES.GOVERNANCE,    label: 'Governance',    icon: <AccountBalanceIcon fontSize="small" /> },
  { path: ROUTES.GAMIFICATION,  label: 'Gamification',  icon: <EmojiEventsIcon fontSize="small" /> },
  { path: ROUTES.REPORTS,       label: 'Reports',       icon: <AssessmentIcon fontSize="small" /> },
];

const BOTTOM_NAV = [
  { path: ROUTES.ADMINISTRATION, label: 'Administration', icon: <AdminPanelSettingsIcon fontSize="small" /> },
  { path: ROUTES.PROFILE,        label: 'Profile',        icon: <PersonIcon fontSize="small" /> },
  { path: ROUTES.SETTINGS,       label: 'Settings',       icon: <SettingsIcon fontSize="small" /> },
];

function NavList({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const itemSx = {
    borderRadius: 2,
    mb: 0.5,
    '&.Mui-selected': {
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
      '&:hover': { bgcolor: 'primary.dark' },
    },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <EcoIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main" lineHeight={1.1}>
            {APP_NAME}
          </Typography>
          <Typography variant="caption" color="text.secondary" lineHeight={1}>
            ESG Platform
          </Typography>
        </Box>
      </Box>
      <Divider />

      {/* Main nav */}
      <List sx={{ px: 1.5, pt: 1.5, flex: 1 }}>
        {MAIN_NAV.map((item) => {
          const active = pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton selected={active} onClick={() => handleNav(item.path)} sx={itemSx}>
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* Bottom nav */}
      <List sx={{ px: 1.5, py: 1 }}>
        {BOTTOM_NAV.map((item) => {
          const active = pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton selected={active} onClick={() => handleNav(item.path)} sx={itemSx}>
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export default function MainLayout() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { isOpen: mobileOpen, open: openDrawer, close: closeDrawer } = useSidebar(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate(ROUTES.LOGIN);
  };

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const drawerContent = <NavList onClose={isMobile ? closeDrawer : undefined} />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          ml:    { md: `${SIDEBAR_WIDTH}px` },
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={openDrawer} sx={{ mr: 1 }} aria-label="open menu">
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ flexGrow: 1 }}>
            ESG Management Platform
          </Typography>

          <Tooltip title="Notifications">
            <IconButton sx={{ mr: 0.5 }} aria-label="notifications">
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title={user?.name ?? 'Account'}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" aria-label="user menu">
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.85rem' }}>
                {userInitials}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate(ROUTES.PROFILE); }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); navigate(ROUTES.SETTINGS); }}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={isMobile && mobileOpen}
        onClose={closeDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box' },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Page content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: 'background.default',
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        }}
      >
        <Toolbar />
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>

        <Box
          component="footer"
          sx={{
            py: 1.5,
            px: 3,
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            &copy; {new Date().getFullYear()} {APP_NAME} &middot; ESG Management Platform &middot; v0.1.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
