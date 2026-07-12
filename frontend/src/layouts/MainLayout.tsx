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
  Badge as MuiBadge,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EcoIcon from '@mui/icons-material/EnergySavingsLeaf';
import GroupsIcon from '@mui/icons-material/Groups';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/hooks/useSidebar';
import { SIDEBAR_WIDTH } from '@/utils/constants';

export default function MainLayout() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { isOpen: mobileOpen, open: openDrawer, close: closeDrawer } = useSidebar(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Determine active console context:
  // We use ESG Gamify mode for list views of Challenges, Tasks, Badges, Teams, Rewards
  const isGamifyAdminPortal =
    pathname.startsWith('/gamification/') &&
    !pathname.includes('/new') &&
    !/^\/gamification\/tasks\/[^/]+$/.test(pathname) &&
    !/^\/gamification\/challenges\/[^/]+$/.test(pathname);

  // Determine top bar title text
  let headerTitle = 'ESG Control';
  if (pathname.includes('/challenges/new') || /^\/gamification\/challenges\/\d+/.test(pathname)) {
    headerTitle = 'ESG Auditor';
  } else if (pathname.includes('/tasks/new') || /^\/gamification\/tasks\/\d+/.test(pathname)) {
    headerTitle = 'ESG Control';
  } else if (isGamifyAdminPortal) {
    headerTitle = 'ESG Admin Console';
  }

  const handleLogout = () => {
    setAnchorEl(null);
    logout();
    navigate('/login');
  };

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  // Navigation handlers
  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) closeDrawer();
  };

  // Nav list styling
  const itemSx = {
    borderRadius: '8px',
    mb: 0.5,
    '&.Mui-selected': {
      bgcolor: '#2E7D32',
      color: '#FFFFFF',
      '& .MuiListItemIcon-root': { color: '#FFFFFF' },
      '&:hover': { bgcolor: '#1B5E20' },
    },
  };

  // 1. ESG Control Menu Configuration
  const controlNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
    { path: '/environmental', label: 'Environment', icon: <EcoIcon fontSize="small" /> },
    { path: '/social', label: 'Social', icon: <GroupsIcon fontSize="small" /> },
    { path: '/governance', label: 'Governance', icon: <AccountBalanceIcon fontSize="small" /> },
    { path: '/gamification', label: 'Gamification', icon: <EmojiEventsIcon fontSize="small" /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <LeaderboardIcon fontSize="small" /> },
    { path: '/reports', label: 'Reports', icon: <AssessmentIcon fontSize="small" /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon fontSize="small" /> },
  ];

  // 2. ESG Gamify Menu Configuration
  const gamifyNavItems = [
    { path: '/gamification', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
    { path: '/gamification/challenges', label: 'Challenges', icon: <EmojiEventsIcon fontSize="small" /> },
    { path: '/gamification/tasks', label: 'Tasks', icon: <AssignmentIcon fontSize="small" /> },
    { path: '/gamification/badges', label: 'Badges', icon: <MilitaryTechIcon fontSize="small" /> },
    { path: '/gamification/teams', label: 'Teams', icon: <GroupsIcon fontSize="small" /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <LeaderboardIcon fontSize="small" /> },
    { path: '/gamification/rewards', label: 'Rewards', icon: <CardGiftcardIcon fontSize="small" /> },
    { path: '/reports', label: 'Reports', icon: <AssessmentIcon fontSize="small" /> },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sidebar Header branding */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {isGamifyAdminPortal ? (
          <>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                bgcolor: '#2E7D32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <EmojiEventsIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="#2E7D32" lineHeight={1.1}>
                ESG Gamify
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} lineHeight={1}>
                Admin Portal
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                bgcolor: '#2E7D32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <EcoIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="text.primary" lineHeight={1.1}>
                ESG Control
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} lineHeight={1}>
                Sustainability Audit
              </Typography>
            </Box>
          </>
        )}
      </Box>
      <Divider sx={{ mb: 1 }} />

      {/* Navigation Links list */}
      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {isGamifyAdminPortal ? (
          gamifyNavItems.map((item) => {
            // Match active path exactly or sub-routes
            const active = pathname === item.path || (item.path !== '/gamification' && pathname.startsWith(item.path));
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton selected={active} onClick={() => handleNav(item.path)} sx={itemSx}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 700 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })
        ) : (
          controlNavItems.map((item) => {
            const active = pathname === item.path || (item.path === '/gamification' && pathname.startsWith('/gamification'));
            return (
              <ListItem key={item.path} disablePadding>
                <ListItemButton selected={active} onClick={() => handleNav(item.path)} sx={itemSx}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 700 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })
        )}
      </List>

      {/* Settings & Logout for ESG Gamify mode bottom */}
      {isGamifyAdminPortal && (
        <Box sx={{ px: 1.5, pb: 2 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNav('/settings')} sx={itemSx}>
              <ListItemIcon sx={{ minWidth: 36 }}><SettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ ...itemSx, color: 'error.main', '& .MuiListItemIcon-root': { color: 'error.main' } }}>
              <ListItemIcon sx={{ minWidth: 36 }}><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Log Out" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        </Box>
      )}

      {/* New Report green button for ESG Control bottom */}
      {!isGamifyAdminPortal && (
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/reports')}
            sx={{
              borderRadius: '8px',
              py: 1,
              fontSize: '0.85rem',
              bgcolor: '#1b4d3e',
              '&:hover': { bgcolor: '#113027' },
            }}
          >
            New Report
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          ml:    { md: `${SIDEBAR_WIDTH}px` },
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton edge="start" onClick={openDrawer} sx={{ mr: 1 }} aria-label="open menu">
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={700} color="#1b4d3e" sx={{ fontSize: '1.25rem' }}>
              {headerTitle}
            </Typography>
          </Box>

          {/* Top Bar Middle Search Bar (Conditional) */}
          {isGamifyAdminPortal && !isMobile && (
            <TextField
              size="small"
              placeholder="Search..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: 320,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  bgcolor: 'rgba(0,0,0,0.02)',
                  '& fieldset': { borderColor: 'rgba(0,0,0,0.06)' },
                },
              }}
            />
          )}

          {/* Top Bar Actions on the Right */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton size="small" aria-label="notifications">
                <MuiBadge badgeContent={3} color="error">
                  <NotificationsIcon sx={{ fontSize: 22 }} />
                </MuiBadge>
              </IconButton>
            </Tooltip>

            {/* Gear Settings icon shown only in ESG Gamify Portal */}
            {isGamifyAdminPortal && (
              <Tooltip title="Settings">
                <IconButton onClick={() => navigate('/settings')} size="small">
                  <SettingsIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Help">
              <IconButton size="small">
                <HelpOutlineIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title={user?.name ?? 'Account'}>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ ml: 0.5 }}>
                <Avatar sx={{ bgcolor: '#2E7D32', width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700 }}>
                  {userInitials}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          {/* User Profile dropdown menu */}
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
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

      {/* Mobile Sidebar drawer */}
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

      {/* Desktop Sidebar drawer */}
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

      {/* Main Page Area Content wrapper */}
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
        <Box sx={{ flex: 1, p: { xs: 2.5, sm: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
