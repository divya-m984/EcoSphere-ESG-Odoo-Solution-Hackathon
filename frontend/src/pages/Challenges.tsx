import { useState } from 'react';
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
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';

interface ChallengeItem {
  id: string;
  title: string;
  category: string;
  xpReward: number;
  startDate: string;
  endDate: string;
  mode: 'Solo' | 'Team';
}

const INITIAL_CHALLENGES: ChallengeItem[] = [
  {
    id: '1',
    title: 'Zero Waste Week 2024',
    category: 'Environment',
    xpReward: 500,
    startDate: '01 Oct',
    endDate: '07 Oct',
    mode: 'Solo',
  },
  {
    id: '2',
    title: 'Community Clean-up Drive',
    category: 'Social',
    xpReward: 1200,
    startDate: '15 Oct',
    endDate: '15 Oct',
    mode: 'Team',
  },
  {
    id: '3',
    title: 'Q3 Ethics Certification',
    category: 'Governance',
    xpReward: 250,
    startDate: '01 Sep',
    endDate: '30 Sep',
    mode: 'Solo',
  },
  {
    id: '4',
    title: 'Reduce Paper Usage 50%',
    category: 'Environment',
    xpReward: 800,
    startDate: '01 Aug',
    endDate: '31 Aug',
    mode: 'Solo',
  },
  {
    id: '5',
    title: '2023 Energy Audit Compliance',
    category: 'Governance',
    xpReward: 1000,
    startDate: '01 Jan',
    endDate: '31 Dec',
    mode: 'Team',
  },
];

export default function Challenges() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['Active']);
  const [selectedModes, setSelectedModes] = useState<string[]>(['Solo', 'Team']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Environment']);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedStatus([]);
    setSelectedModes([]);
    setSelectedCategories([]);
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Top Breadcrumbs & Action */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/gamification'); }}>
            Gamification
          </Link>
          <Typography color="text.primary">Challenges</Typography>
        </Breadcrumbs>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/gamification/challenges/new')}
          sx={{ borderRadius: '8px', px: 3 }}
        >
          New Challenge
        </Button>
      </Box>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        Challenges
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
              {['Draft', 'Active', 'Under Review', 'Completed', 'Archived'].map((status) => (
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

            {/* Category section */}
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, letterSpacing: 0.5 }}>
              CATEGORY
            </Typography>
            <FormGroup>
              {['Environment', 'Social', 'Governance', 'Community'].map((category) => (
                <FormControlLabel
                  key={category}
                  control={
                    <Checkbox
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{category}</Typography>}
                  sx={{ my: -0.2 }}
                />
              ))}
            </FormGroup>
          </Card>
        </Grid>

        {/* Challenges Table Right Panel */}
        <Grid item xs={12} md={9}>
          <Card sx={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: 'none', overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                Showing 1-{INITIAL_CHALLENGES.length} of 42 Challenges
              </Typography>
              <TextField
                size="small"
                placeholder="Search challenges..."
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
                    <TableCell padding="checkbox">
                      <Checkbox size="small" color="primary" />
                    </TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">TITLE</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">CATEGORY</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">XP REWARD</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">DURATION</Typography></TableCell>
                    <TableCell><Typography variant="caption" fontWeight={700} color="text.secondary">PARTICIPATION</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {INITIAL_CHALLENGES.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => navigate(`/gamification/challenges/${row.id}`)}
                      sx={{ cursor: 'pointer', '&:last-child cell': { border: 0 } }}
                    >
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox size="small" color="primary" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.title}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell sx={{ color: 'warning.main', fontWeight: 700 }}>+{row.xpReward} XP</TableCell>
                      <TableCell>{row.startDate} - {row.endDate}</TableCell>
                      <TableCell>{row.mode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Table Footer */}
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1.5,
                borderTop: '1px solid rgba(0,0,0,0.06)',
                bgcolor: 'rgba(0,0,0,0.01)'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Rows per page:
              </Typography>
              <Select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: '6px',
                  height: '32px',
                  fontSize: '0.8rem',
                  '& .MuiSelect-select': { py: 0.5, px: 1 },
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={15}>15</MenuItem>
                <MenuItem value={30}>30</MenuItem>
              </Select>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
