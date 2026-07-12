import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
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
  Chip,
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
import HelpIcon from '@mui/icons-material/HelpOutline';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/hooks/useSidebar';
import { SIDEBAR_WIDTH } from '@/utils/constants';
import api from '@/services/api';

export default function MainLayout() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { isOpen: mobileOpen, open: openDrawer, close: closeDrawer } = useSidebar(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [xp, setXp] = useState<number>(2000);

  // Fetch actual XP balance for the employee if logged in
  useEffect(() => {
    if (user?.role === 'Employee') {
      api.get('/rewards/balance')
        .then((res) => {
          if (res.data && typeof res.data.balance === 'number') {
            setXp(res.data.balance);
          }
        })
        .catch((err) => console.error('Failed to fetch XP balance:', err));
    }
  }, [user]);

  const level = Math.floor(xp / 150) + 1;
  const userTitle = xp >= 1500 ? 'ECO-WARRIOR' : xp >= 750 ? 'GREEN CHAMPION' : 'ECO-NOVICE';

  const isEmployee = user?.role === 'Employee';

  // Determine active console context:
  // For admins/managers, we use ESG Gamify mode for list views of Challenges, Tasks, Badges, Teams, Rewards.
  const isGamifyAdminPortal =
    !isEmployee &&
    (pathname === '/gamification' || pathname.startsWith('/gamification/')) &&
    !pathname.includes('/new') &&
    !/^\/gamification\/tasks\/[a-f0-9-]+/i.test(pathname) &&
    !/^\/gamification\/challenges\/[a-f0-9-]+/i.test(pathname);

  // Determine active tab for Employee
  let activeTab = 'Dashboard';
  if (
    pathname.startsWith('/gamification/challenges') ||
    pathname.startsWith('/gamification/badges') ||
    pathname.startsWith('/gamification/rewards')
  ) {
    activeTab = 'Impact';
  } else if (pathname.startsWith('/leaderboard') || pathname.startsWith('/gamification/teams')) {
    activeTab = 'Community';
  }

  // Determine top bar title text for admin
  let headerTitle = 'ESG Control';
  if (pathname.includes('/challenges/new') || /^\/gamification\/challenges\/[a-f0-9-]+/i.test(pathname)) {
    headerTitle = 'ESG Auditor';
  } else if (pathname.includes('/tasks/new') || /^\/gamification\/tasks\/[a-f0-9-]+/i.test(pathname)) {
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

  // 1. ESG Control Menu Configuration (Admin/Manager)
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

  // 2. ESG Gamify Menu Configuration (Admin/Manager)
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

  // 3. Employee Dashboard Sidebar Menu Configuration
  const employeeControlNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
    { path: '/gamification/challenges', label: 'Gamification', icon: <EmojiEventsIcon fontSize="small" /> },
    { path: '/environmental', label: 'Environmental', icon: <EcoIcon fontSize="small" /> },
    { path: '/social', label: 'Social', icon: <GroupsIcon fontSize="small" /> },
    { path: '/governance', label: 'Governance', icon: <AccountBalanceIcon fontSize="small" /> },
    { path: '/reports', label: 'Reports', icon: <AssessmentIcon fontSize="small" /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon fontSize="small" /> },
    { path: '#help', label: 'Help', icon: <HelpIcon fontSize="small" /> },
  ];

  // 4. Employee Impact/Community Sidebar Menu Configuration
  const employeeImpactNavItems = [
    { path: '/environmental', label: 'Environment', icon: <EcoIcon fontSize="small" />, badge: 6 },
    { path: '/social', label: 'Social', icon: <GroupsIcon fontSize="small" />, badge: 4 },
    { path: '/governance', label: 'Governance', icon: <AccountBalanceIcon fontSize="small" />, badge: 2 },
    { path: '/reports', label: 'Reports', icon: <AssessmentIcon fontSize="small" /> },
    { path: '/gamification/challenges', label: 'Challenges', icon: <EmojiEventsIcon fontSize="small" /> },
    { path: '/gamification/badges', label: 'Badges', icon: <MilitaryTechIcon fontSize="small" /> },
    { path: '/leaderboard', label: 'Leaderboard', icon: <LeaderboardIcon fontSize="small" /> },
    { path: '/gamification/rewards', label: 'Rewards', icon: <CardGiftcardIcon fontSize="small" /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon fontSize="small" /> },
    { path: '#support', label: 'Support', icon: <HelpIcon fontSize="small" /> },
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sidebar Header branding */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {isEmployee ? (
          activeTab === 'Dashboard' ? (
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
                <Typography variant="subtitle1" fontWeight={750} color="text.primary" lineHeight={1.1}>
                  EcoSphere
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600} lineHeight={1}>
                  ESG Management
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
                <EmojiEventsIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={750} color="#2E7D32" lineHeight={1.1}>
                  ESG Pulse
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600} lineHeight={1}>
                  Sustainability Audit
                </Typography>
              </Box>
            </>
          )
        ) : isGamifyAdminPortal ? (
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
        {isEmployee ? (
          activeTab === 'Dashboard' ? (
            employeeControlNavItems.map((item) => {
              const active = pathname === item.path || (item.path === '/gamification/challenges' && pathname.startsWith('/gamification'));
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
            employeeImpactNavItems.map((item) => {
              const active = pathname === item.path || (item.path !== '/gamification' && pathname.startsWith(item.path));
              return (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton selected={active} onClick={() => handleNav(item.path)} sx={itemSx}>
                    <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 700 : 500 }}
                    />
                    {item.badge !== undefined && (
                      <Chip
                        label={item.badge}
                        size="small"
                        sx={{
                          height: 20,
                          minWidth: 20,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          bgcolor:
                            item.label === 'Environment'
                              ? '#E2F0D9'
                              : item.label === 'Social'
                              ? '#FFF2CC'
                              : '#FCE4D6',
                          color:
                            item.label === 'Environment'
                              ? '#385723'
                              : item.label === 'Social'
                              ? '#7F6000'
                              : '#C65911',
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })
          )
        ) : isGamifyAdminPortal ? (
          gamifyNavItems.map((item) => {
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

      {/* Bottom Button and Logs */}
      {isEmployee ? (
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={activeTab === 'Dashboard' ? <AddIcon /> : <AddIcon />}
            onClick={() => navigate('/reports')}
            sx={{
              borderRadius: '8px',
              py: 1,
              fontSize: '0.85rem',
              bgcolor: '#1b4d3e',
              '&:hover': { bgcolor: '#113027' },
            }}
          >
            {activeTab === 'Dashboard' ? 'Generate Report' : '+ Submit Report'}
          </Button>
        </Box>
      ) : (
        !isGamifyAdminPortal && (
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
        )
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
          ml: { md: `${SIDEBAR_WIDTH}px` },
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
            <Typography variant="h6" fontWeight={750} color="#1b4d3e" sx={{ fontSize: '1.25rem' }}>
              {isEmployee
                ? activeTab === 'Dashboard'
                  ? 'EcoSphere'
                  : 'ESG Impact'
                : headerTitle}
            </Typography>

            {isEmployee && !isMobile && activeTab === 'Dashboard' && (
              <TextField
                size="small"
                placeholder="Search tasks or milestones..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: 280,
                  ml: 4,
                  '& .MuiOutlinedInput-root': {
                    height: 36,
                    borderRadius: '20px',
                    bgcolor: '#F3F6F4',
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
            )}
          </Box>

          {/* Employee Navigation Center Tabs */}
          {isEmployee && !isMobile && (
            <Box sx={{ display: 'flex', gap: 3, mx: 'auto' }}>
              <Button
                component={Link}
                to="/dashboard"
                sx={{
                  color: activeTab === 'Dashboard' ? '#2E7D32' : 'text.secondary',
                  fontWeight: activeTab === 'Dashboard' ? 800 : 600,
                  borderBottom: activeTab === 'Dashboard' ? '3px solid #2E7D32' : '3px solid transparent',
                  borderRadius: 0,
                  px: 1,
                  py: 0.5,
                  minWidth: 0,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  '&:hover': { bgcolor: 'transparent', color: '#1B5E20' },
                }}
              >
                Dashboard
              </Button>
              <Button
                component={Link}
                to="/gamification/challenges"
                sx={{
                  color: activeTab === 'Impact' ? '#2E7D32' : 'text.secondary',
                  fontWeight: activeTab === 'Impact' ? 800 : 600,
                  borderBottom: activeTab === 'Impact' ? '3px solid #2E7D32' : '3px solid transparent',
                  borderRadius: 0,
                  px: 1,
                  py: 0.5,
                  minWidth: 0,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  '&:hover': { bgcolor: 'transparent', color: '#1B5E20' },
                }}
              >
                Impact
              </Button>
              <Button
                component={Link}
                to="/leaderboard"
                sx={{
                  color: activeTab === 'Community' ? '#2E7D32' : 'text.secondary',
                  fontWeight: activeTab === 'Community' ? 800 : 600,
                  borderBottom: activeTab === 'Community' ? '3px solid #2E7D32' : '3px solid transparent',
                  borderRadius: 0,
                  px: 1,
                  py: 0.5,
                  minWidth: 0,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  '&:hover': { bgcolor: 'transparent', color: '#1B5E20' },
                }}
              >
                Community
              </Button>
            </Box>
          )}

          {/* Top Bar Middle Search Bar (Conditional for admin) */}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Notifications">
              <IconButton size="small" aria-label="notifications">
                <MuiBadge badgeContent={3} color="error">
                  <NotificationsIcon sx={{ fontSize: 22 }} />
                </MuiBadge>
              </IconButton>
            </Tooltip>

            {/* Gear Settings icon shown only in ESG Gamify Portal for admins */}
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

            {/* Employee Level Indicator */}
            {isEmployee && !isMobile && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 0.5 }}>
                <Typography variant="body2" fontWeight={850} sx={{ color: '#1b4d3e', lineHeight: 1.1 }}>
                  {user?.name || 'Alex Green'}
                </Typography>
                <Typography variant="caption" fontWeight={850} sx={{ color: '#2E7D32', fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                  LVL {level} {userTitle}
                </Typography>
              </Box>
            )}

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
