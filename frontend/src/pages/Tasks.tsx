import React, { useState } from 'react';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Card,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';

interface TaskItem {
  id: string;
  title: string;
  subtitle: string;
  xpPerCompletion: number;
  cadence: 'One-time' | 'Daily' | 'Weekly' | 'Repeatable';
  participation: 'Solo' | 'Team';
  milestones: string;
  status: 'Active' | 'Inactive' | 'Draft';
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: '1',
    title: 'Complete Security Training',
    subtitle: 'Annual compliance module',
    xpPerCompletion: 500,
    cadence: 'One-time',
    participation: 'Solo',
    milestones: '1 tier',
    status: 'Active',
  },
  {
    id: '2',
    title: 'Bike to Work',
    subtitle: 'Log a sustainable commute',
    xpPerCompletion: 50,
    cadence: 'Daily',
    participation: 'Solo',
    milestones: '3 tiers',
    status: 'Active',
  },
  {
    id: '3',
    title: 'Department Recycling Drive',
    subtitle: 'Collect recyclable materials',
    xpPerCompletion: 250,
    cadence: 'Weekly',
    participation: 'Team',
    milestones: '5 tiers',
    status: 'Inactive',
  },
  {
    id: '4',
    title: 'Suggest Energy Saving Idea',
    subtitle: 'Submit via internal portal',
    xpPerCompletion: 100,
    cadence: 'Repeatable',
    participation: 'Solo',
    milestones: '--',
    status: 'Active',
  },
];

export default function Tasks() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [selectedCadences, setSelectedCadences] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Table action menu states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTaskId(id);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedTaskId(null);
  };

  const handleEdit = () => {
    if (selectedTaskId) {
      navigate(`/gamification/tasks/${selectedTaskId}`);
    }
    handleActionClose();
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleModeChange = (mode: string) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const handleCadenceChange = (cadence: string) => {
    setSelectedCadences((prev) =>
      prev.includes(cadence) ? prev.filter((c) => c !== cadence) : [...prev, cadence]
    );
  };

  const clearFilters = () => {
    setSelectedStatus([]);
    setSelectedModes([]);
    setSelectedCadences([]);
  };

  const getCadenceColor = (cadence: string) => {
    switch (cadence) {
      case 'Daily':
      case 'Weekly':
        return { bgcolor: 'rgba(76, 175, 80, 0.12)', color: '#2E7D32' };
      default:
        return { bgcolor: 'rgba(0, 0, 0, 0.06)', color: 'text.secondary' };
    }
  };

  const getParticipationColor = (mode: string) => {
    if (mode === 'Team') {
      return { bgcolor: 'rgba(121, 85, 72, 0.12)', color: '#5D4037' };
    }
    return { bgcolor: 'rgba(0, 0, 0, 0.06)', color: 'text.secondary' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return { bgcolor: '#2E7D32', color: '#FFFFFF' };
      case 'Inactive':
        return { bgcolor: '#9E9E9E', color: '#FFFFFF' };
      default:
        return { bgcolor: 'rgba(0, 0, 0, 0.06)', color: 'text.secondary' };
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Breadcrumbs & Top Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/gamification'); }}>
            Gamification
          </Link>
          <Typography color="text.primary">Tasks</Typography>
        </Breadcrumbs>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/gamification/tasks/new')}
          sx={{ borderRadius: '8px', px: 3, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          New Task
        </Button>
      </Box>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        Tasks
      </Typography>

      <Grid container spacing={3}>
        {/* Filters Left Sidebar */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon fontSize="small" /> Filters
              </Typography>
              <Button size="small" onClick={clearFilters} sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Clear
              </Button>
            </Box>

            {/* Status section */}
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: 0.5 }}>
              STATUS
            </Typography>
            <FormGroup sx={{ mb: 3 }}>
              {['Active', 'Inactive', 'Draft'].map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={selectedStatus.includes(status)}
                      onChange={() => handleStatusChange(status)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{status}</Typography>}
                  sx={{ my: -0.2 }}
                />
              ))}
            </FormGroup>

            {/* Participation mode section */}
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: 0.5 }}>
              PARTICIPATION MODE
            </Typography>
            <FormGroup sx={{ mb: 3 }}>
              {['Solo', 'Team'].map((mode) => (
                <FormControlLabel
                  key={mode}
                  control={
                    <Checkbox
                      checked={selectedModes.includes(mode)}
                      onChange={() => handleModeChange(mode)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{mode}</Typography>}
                  sx={{ my: -0.2 }}
                />
              ))}
            </FormGroup>

            {/* Cadence section */}
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: 0.5 }}>
              CADENCE
            </Typography>
            <FormGroup>
              {['One-time', 'Daily', 'Weekly', 'Repeatable'].map((cadence) => (
                <FormControlLabel
                  key={cadence}
                  control={
                    <Checkbox
                      checked={selectedCadences.includes(cadence)}
                      onChange={() => handleCadenceChange(cadence)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{cadence}</Typography>}
                  sx={{ my: -0.2 }}
                />
              ))}
            </FormGroup>
          </Card>
        </Grid>

        {/* Tasks Table Right Panel */}
        <Grid item xs={12} md={9}>
          <Card sx={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none', overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Showing 1-4 of 24 tasks
              </Typography>
              <TextField
                size="small"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                  <TableRow>
                    <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">Title</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={700} color="text.secondary">XP per Completion</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={700} color="text.secondary">Cadence</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={700} color="text.secondary">Participation</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={700} color="text.secondary">Milestones</Typography></TableCell>
                    <TableCell align="center"><Typography variant="caption" fontWeight={700} color="text.secondary">Status</Typography></TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {INITIAL_TASKS.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => navigate(`/gamification/tasks/${row.id}`)}
                      sx={{ cursor: 'pointer', '&:last-child cell': { border: 0 } }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                          {row.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.subtitle}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'warning.main', fontWeight: 700, fontSize: '0.95rem' }}>
                        {row.xpPerCompletion}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.cadence}
                          size="small"
                          sx={{
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            ...getCadenceColor(row.cadence)
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.participation}
                          size="small"
                          sx={{
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            ...getParticipationColor(row.participation)
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {row.milestones}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={row.status}
                          size="small"
                          sx={{
                            borderRadius: '6px',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            ...getStatusColor(row.status)
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton onClick={(e) => handleActionClick(e, row.id)} size="small">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Footer */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                bgcolor: 'rgba(0,0,0,0.01)'
              }}
            >
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Showing 1 to 4 of 24 tasks
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" disabled sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '6px' }}>
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mx: 1 }}>
                  Page 1 of 3
                </Typography>
                <IconButton size="small" sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '6px' }}>
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Action Popover Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEdit}>Edit Task</MenuItem>
        <MenuItem onClick={handleActionClose}>Deactivate</MenuItem>
        <MenuItem onClick={handleActionClose} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>
    </Box>
  );
}
