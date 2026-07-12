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
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '@/hooks/useAuth';
import { useColorMode } from '@/context/ColorModeContext';
import { useSidebar } from '@/hooks/useSidebar';
import { SIDEBAR_WIDTH } from '@/utils/constants';
import api from '@/services/api';

export default function MainLayout() {
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { isOpen: mobileOpen, open: openDrawer, close: closeDrawer } = useSidebar(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const { toggleMode, effectiveMode } = useColorMode();
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

  const isGamifyAdminPortal =
    !isEmployee &&
    (pathname === '/gamification' || pathname.startsWith('/gamification/')) &&
    !pathname.includes('/new') &&
    !/^\/gamification\/tasks\/[a-f0-9-]+/i.test(pathname) &&
    !/^\/gamification\/challenges\/[a-f0-9-]+/i.test(pathname);

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

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile) closeDrawer();
  };

  // Nav item styling — selected state is handled by MuiListItemButton theme override
  const itemSx = { mb: 0.5 };

  // ── Navigation menus ───────────────────────────────────────────────────────

  const controlNavItems = [
    { path: '/dashboard',      label: 'Dashboard',    icon: <DashboardIcon fontSize="small" /> },
    { path: '/environmental',  label: 'Environment',  icon: <EcoIcon fontSize="small" /> },
    { path: '/social',         label: 'Social',       icon: <GroupsIcon fontSize="small" /> },
    { path: '/governance',     label: 'Governance',   icon: <AccountBalanceIcon fontSize="small" /> },
    { path: '/gamification',   label: 'Gamification', icon: <EmojiEventsIcon fontSize="small" /> },
    { path: '/leaderboard',    label: 'Leaderboard',  icon: <LeaderboardIcon fontSize="small" /> },
    { path: '/reports',        label: 'Reports',      icon: <AssessmentIcon fontSize="small" /> },
    { path: '/settings',       label: 'Settings',     icon: <SettingsIcon fontSize="small" /> },
  ];

  const gamifyNavItems = [
    { path: '/gamification',          label: 'Dashboard',  icon: <DashboardIcon fontSize="small" /> },
    { path: '/gamification/challenges', label: 'Challenges', icon: <EmojiEventsIcon fontSize="small" /> },
    { path: '/gamification/tasks',    label: 'Tasks',      icon: <AssignmentIcon fontSize="small" /> },
    { path: '/gamification/badges',   label: 'Badges',     icon: <MilitaryTechIcon fontSize="small" /> },
    { path: '/gamification/teams',    label: 'Teams',      icon: <GroupsIcon fontSize="small" /> },
    { path: '/leaderboard',           label: 'Leaderboard', icon: <LeaderboardIcon fontSize="small" /> },
    { path: '/gamification/rewards',  label: 'Rewards',    icon: <CardGiftcardIcon fontSize="small" /> },
    { path: '/reports',               label: 'Reports',    icon: <AssessmentIcon fontSize="small" /> },
  ];

  const employeeControlNavItems = [
    { path: '/dashboard',              label: 'Dashboard',    icon: <DashboardIcon fontSize="small" /> },
    { path: '/gamification/challenges', label: 'Gamification', icon: <EmojiEventsIcon fontSize="small" /> },
    { path: '/environmental',          label: 'Environmental', icon: <EcoIcon fontSize="small" /> },
    { path: '/social',                 label: 'Social',       icon: <GroupsIcon fontSize="small" /> },
    { path: '/governance',             label: 'Governance',   icon: <AccountBalanceIcon fontSize="small" /> },
    { path: '/reports',                label: 'Reports',      icon: <AssessmentIcon fontSize="small" /> },
    { path: '/settings',               label: 'Settings',     icon: <SettingsIcon fontSize="small" /> },
    { path: '#help',                   label: 'Help',         icon: <HelpIcon fontSize="small" /> },
  ];

  const employeeImpactNavItems = [
    { path: '/environmental',          label: 'Environment', icon: <EcoIcon fontSize="small" />, badge: 6 },
    { path: '/social',                 label: 'Social',      icon: <GroupsIcon fontSize="small" />, badge: 4 },
    { path: '/governance',             label: 'Governance',  icon: <AccountBalanceIcon fontSize="small" />, badge: 2 },
    { path: '/reports',                label: 'Reports',     icon: <AssessmentIcon fontSize="small" /> },
    { path: '/gamification/challenges', label: 'Challenges', icon: <EmojiEventsIcon fontSize="small" /> },
    { path: '/gamification/badges',    label: 'Badges',      icon: <MilitaryTechIcon fontSize="small" /> },
    { path: '/leaderboard',            label: 'Leaderboard', icon: <LeaderboardIcon fontSize="small" /> },
    { path: '/gamification/rewards',   label: 'Rewards',     icon: <CardGiftcardIcon fontSize="small" /> },
    { path: '/settings',               label: 'Settings',    icon: <SettingsIcon fontSize="small" /> },
    { path: '#support',                label: 'Support',     icon: <HelpIcon fontSize="small" /> },
  ];

  // ── Sidebar icon box style ─────────────────────────────────────────────────

  const brandIconBoxSx = {
    width: 38,
    height: 38,
    borderRadius: '8px',
    bgcolor: 'primary.main',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  // ── Badge colour helper ────────────────────────────────────────────────────

  function badgeChipSx(label: string) {
    if (label === 'Environment') {
      return {
        bgcolor: isDark ? 'rgba(52,211,153,0.15)' : '#E2F0D9',
        color:   isDark ? '#34D399' : '#385723',
      };
    }
    if (label === 'Social') {
      return {
        bgcolor: isDark ? 'rgba(251,191,36,0.15)' : '#FFF2CC',
        color:   isDark ? '#FBBF24' : '#7F6000',
      };
    }
    return {
      bgcolor: isDark ? 'rgba(248,113,113,0.15)' : '#FCE4D6',
      color:   isDark ? '#F87171' : '#C65911',
    };
  }

  // ── Drawer content ─────────────────────────────────────────────────────────

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sidebar header branding */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {isEmployee ? (
          activeTab === 'Dashboard' ? (
            <>
              <Box sx={brandIconBoxSx}>
                <EcoIcon sx={{ color: 'primary.contrastText', fontSize: 20 }} />
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
              <Box sx={brandIconBoxSx}>
                <EmojiEventsIcon sx={{ color: 'primary.contrastText', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={750} color="primary.main" lineHeight={1.1}>
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
            <Box sx={brandIconBoxSx}>
              <EmojiEventsIcon sx={{ color: 'primary.contrastText', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="primary.main" lineHeight={1.1}>
                ESG Gamify
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} lineHeight={1}>
                Admin Portal
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Box sx={brandIconBoxSx}>
              <EcoIcon sx={{ color: 'primary.contrastText', fontSize: 20 }} />
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
      <Divider />

      {/* Navigation list */}
      <List sx={{ px: 1.5, flexGrow: 1, pt: 1 }}>
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
                          ...badgeChipSx(item.label),
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

      {/* Bottom action button */}
      {isEmployee ? (
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/reports')}
            sx={{ borderRadius: '6px', py: 1, fontSize: '0.85rem' }}
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
              sx={{ borderRadius: '6px', py: 1, fontSize: '0.85rem' }}
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
      {/* Top app bar — bg driven by MuiAppBar theme override */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          ml: { md: `${SIDEBAR_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton edge="start" onClick={openDrawer} sx={{ mr: 1 }} aria-label="open menu">
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" fontWeight={750} color="primary.main" sx={{ fontSize: '1.25rem' }}>
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
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
            )}
          </Box>

          {/* Employee navigation tabs */}
          {isEmployee && !isMobile && (
            <Box sx={{ display: 'flex', gap: 3, mx: 'auto' }}>
              {(['Dashboard', 'Impact', 'Community'] as const).map((tab) => {
                const to = tab === 'Dashboard' ? '/dashboard' : tab === 'Impact' ? '/gamification/challenges' : '/leaderboard';
                const active = activeTab === tab;
                return (
                  <Button
                    key={tab}
                    component={Link}
                    to={to}
                    sx={{
                      color: active ? 'primary.main' : 'text.secondary',
                      fontWeight: active ? 800 : 600,
                      borderBottom: active ? '2px solid' : '2px solid transparent',
                      borderColor: active ? 'primary.main' : 'transparent',
                      borderRadius: 0,
                      px: 1,
                      py: 0.5,
                      minWidth: 0,
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
                    }}
                  >
                    {tab}
                  </Button>
                );
              })}
            </Box>
          )}

          {/* Admin search */}
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
              sx={{ width: 280 }}
            />
          )}

          {/* Right actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Notifications">
              <IconButton size="small" aria-label="notifications">
                <MuiBadge badgeContent={3} color="error">
                  <NotificationsIcon sx={{ fontSize: 22 }} />
                </MuiBadge>
              </IconButton>
            </Tooltip>

            {isGamifyAdminPortal && (
              <Tooltip title="Settings">
                <IconButton onClick={() => navigate('/settings')} size="small" aria-label="settings">
                  <SettingsIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Help">
              <IconButton size="small" aria-label="help">
                <HelpOutlineIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>

            {/* Theme toggle */}
            <Tooltip title={effectiveMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton
                size="small"
                onClick={toggleMode}
                aria-label={effectiveMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {effectiveMode === 'dark'
                  ? <Brightness7Icon sx={{ fontSize: 22 }} />
                  : <Brightness4Icon sx={{ fontSize: 22 }} />}
              </IconButton>
            </Tooltip>

            {/* Employee level indicator */}
            {isEmployee && !isMobile && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mx: 0.5 }}>
                <Typography variant="body2" fontWeight={850} color="text.primary" lineHeight={1.1}>
                  {user?.name || 'Alex Green'}
                </Typography>
                <Typography variant="caption" fontWeight={850} color="primary.main" sx={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                  LVL {level} {userTitle}
                </Typography>
              </Box>
            )}

            <Tooltip title={user?.name ?? 'Account'}>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ ml: 0.5 }} aria-label="account menu">
                <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 34, height: 34, fontSize: '0.8rem', fontWeight: 700 }}>
                  {userInitials}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          {/* User profile dropdown */}
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

      {/* Desktop drawer */}
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

      {/* Main content area */}
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
