import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  Fab,
  Tabs,
  Tab,
  Autocomplete,
  List,
  ListItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  LocationOn as LocationOnIcon,
  DeviceHub as ThingIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Build as BuildIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  Info as InfoIcon,
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useSnackbar } from 'notistack';

import { apiService } from '../api';
import { 
  DigitalTwin, 
  CreateTwinRequest, 
  DigitalTwinType, 
  DIGITAL_TWIN_TYPES
} from '../types';

const Things: React.FC = () => {
  const [twins, setTwins] = useState<DigitalTwin[]>([]);
  const [filteredTwins, setFilteredTwins] = useState<DigitalTwin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editDialog, setEditDialog] = useState<{ open: boolean; twin: DigitalTwin | null }>({
    open: false,
    twin: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; twin: DigitalTwin | null }>({
    open: false,
    twin: null,
  });
  const [editForm, setEditForm] = useState<CreateTwinRequest>({
    name: '',
    type: 'Device' as DigitalTwinType,
    status: 'active',
    description: '',
    location: {},
    assetMetadata: {},
    maintenanceInfo: {},
    telemetryOverview: {},
    operationalSettings: {
      operatingMode: 'auto',
      safetyLimits: {}
    },
    relationships: {
      childAssetIds: []
    },
    customProperties: [],
    commands: [],
    performanceMetrics: {},
    tags: [],
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [editActiveTab, setEditActiveTab] = useState(0);

  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const loadTwins = async () => {
    try {
      setError(null);
      const data = await apiService.getAllTwins();
      setTwins(data);
      setFilteredTwins(data);
    } catch (err: any) {
      if (err.isOffline || err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        // Offline mode - don't show error popup, just set offline message
        setTwins([]);
        setFilteredTwins([]);
        setError('Backend services are offline. Start Docker services to load digital twins.');
        console.log('Things page in offline mode');
      } else {
        const errorMessage = 'Failed to load digital twins';
        setError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    applyFilters(term, statusFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    applyFilters(searchTerm, status);
  };

  const applyFilters = (search: string, status: string) => {
    let filtered = twins;

    if (search) {
      filtered = filtered.filter(
        (twin) =>
          (twin.attributes?.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (twin.attributes?.type || '').toLowerCase().includes(search.toLowerCase()) ||
          (twin.thingId || '').toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter((twin) => twin.attributes?.status === status);
    }

    setFilteredTwins(filtered);
  };

  const handleEdit = (twin: DigitalTwin) => {
    setEditForm({
      name: twin.attributes?.name || '',
      type: twin.attributes?.type || 'Device',
      status: twin.attributes?.status || 'inactive',
      description: twin.attributes?.description || '',
      version: twin.attributes?.version || '',
      location: twin.attributes?.location || {
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        latitude: 0,
        longitude: 0,
        building: '',
        room: ''
      },
      assetMetadata: twin.attributes?.assetMetadata || {
        manufacturer: '',
        model: '',
        serialNumber: '',
        installationDate: '',
        firmwareVersion: '',
        softwareVersion: '',
        hardwareVersion: '',
        owner: '',
        notes: ''
      },
      maintenanceInfo: twin.attributes?.maintenanceInfo || {
        lastMaintenanceDate: '',
        nextMaintenanceDate: '',
        maintenanceInterval: 0,
        warrantyEndDate: '',
        supportContact: '',
        maintenanceNotes: ''
      },
      telemetryOverview: twin.attributes?.telemetryOverview || {
        dataPoints: [],
        sampleRate: 0,
        retentionPeriod: '',
        alertThresholds: {}
      },
      operationalSettings: twin.attributes?.operationalSettings || {
        reportingInterval: 0,
        energySource: '',
        powerConsumption: 0,
        operatingTemperatureRange: '',
        networkProtocol: '',
        dataFormat: ''
      },
      customProperties: twin.attributes?.customProperties || [],
      commands: twin.attributes?.commands || [],
      performanceMetrics: twin.attributes?.performanceMetrics || {},
      tags: twin.attributes?.tags || [],
      features: twin.features
    });
    setEditDialog({ open: true, twin });
    setEditActiveTab(0); // Reset to first tab
  };

  const handleEditSave = async () => {
    if (!editDialog.twin) return;

    setActionLoading(true);
    try {
      await apiService.updateTwin(editDialog.twin.thingId, editForm);
      setEditDialog({ open: false, twin: null });
      await loadTwins();
      enqueueSnackbar('Digital twin updated successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to update digital twin', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.twin) return;

    setActionLoading(true);
    try {
      await apiService.deleteTwin(deleteDialog.twin.thingId);
      setDeleteDialog({ open: false, twin: null });
      await loadTwins();
      enqueueSnackbar('Digital twin deleted successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Failed to delete digital twin', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#2e7d32';
      case 'inactive': return '#757575';
      case 'maintenance': return '#ed6c02';
      case 'error': return '#d32f2f';
      default: return '#757575';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active': return '#e8f5e8';
      case 'inactive': return '#f5f5f5';
      case 'maintenance': return '#fff3e0';
      case 'error': return '#ffebee';
      default: return '#f5f5f5';
    }
  };

  useEffect(() => {
    loadTwins();
  }, []);

  useEffect(() => {
    applyFilters(searchTerm, statusFilter);
  }, [twins]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            Digital Twins
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your digital twin collection ({filteredTwins.length} of {twins.length})
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/create')}
          sx={{
            bgcolor: '#1976d2',
            '&:hover': { bgcolor: '#1565c0' },
            borderRadius: 2,
            px: 3,
          }}
        >
          Create New Twin
        </Button>
      </Box>

      {/* Error State */}
      {error && (
        <Alert 
          severity="error" 
          action={
            <IconButton color="inherit" size="small" onClick={loadTwins}>
              <RefreshIcon />
            </IconButton>
          }
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, type, or ID..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
                  endAdornment: searchTerm && (
                    <IconButton size="small" onClick={() => handleSearch('')}>
                      <ClearIcon />
                    </IconButton>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Status Filter"
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadTwins}
                sx={{ borderRadius: 2, py: 1.75 }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredTwins.length === 0 && !loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <ThingIcon sx={{ fontSize: 80, color: '#ccc', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2, color: '#666' }}>
              {twins.length === 0 ? 'No Digital Twins Yet' : 'No Twins Match Your Filters'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {twins.length === 0 
                ? 'Start building your digital twin ecosystem by creating your first twin.'
                : 'Try adjusting your search or filter criteria.'
              }
            </Typography>
            {twins.length === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/create')}
                sx={{ bgcolor: '#1976d2' }}
              >
                Create Your First Twin
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Twins Grid */}
      <Grid container spacing={3}>
        {filteredTwins.map((twin) => (
          <Grid item xs={12} sm={6} lg={4} key={twin.thingId}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                {/* Header */}
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      bgcolor: getStatusColor(twin.attributes.status),
                      mr: 2,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <ThingIcon />
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {twin.attributes?.name || 'Unnamed Twin'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {twin.thingId || 'No ID'}
                    </Typography>
                  </Box>
                </Box>

                {/* Status & Type */}
                <Box display="flex" gap={1} mb={2}>
                  <Chip
                    label={twin.attributes?.status || 'unknown'}
                    size="small"
                    sx={{
                      bgcolor: getStatusBgColor(twin.attributes?.status || 'unknown'),
                      color: getStatusColor(twin.attributes?.status || 'unknown'),
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    label={twin.attributes?.type || 'unknown'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>

                {/* Description */}
                {twin.attributes?.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {twin.attributes.description}
                  </Typography>
                )}

                {/* Location */}
                {twin.attributes?.location && (
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {twin.attributes.location.address || 
                       `${twin.attributes.location.latitude || 0}, ${twin.attributes.location.longitude || 0}`}
                    </Typography>
                  </Box>
                )}

                {/* Tags */}
                {twin.attributes?.tags && twin.attributes.tags.length > 0 && (
                  <Box display="flex" gap={1} mt={1.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                      Tags:
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {twin.attributes.tags.slice(0, 3).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                      {twin.attributes.tags.length > 3 && (
                        <Chip
                          label={`+${twin.attributes.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>

              <Divider />

              <CardActions sx={{ p: 2, justifyContent: 'flex-end' }}>
                <IconButton
                  size="small"
                  onClick={() => handleEdit(twin)}
                  sx={{ color: '#1976d2' }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setDeleteDialog({ open: true, twin })}
                  sx={{ color: '#d32f2f' }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, twin: null })} maxWidth="lg" fullWidth sx={{ '& .MuiDialog-paper': { minHeight: '80vh' } }}>
        <DialogTitle>Edit Digital Twin</DialogTitle>
        <DialogContent>
          <Box>
            <Box sx={{ width: '100%' }}>
              <Tabs value={editActiveTab} onChange={(e, newValue) => setEditActiveTab(newValue)} centered>
              <Tab icon={<InfoIcon />} label="Basic Info" />
              <Tab icon={<LocationOnIcon />} label="Location" />
              <Tab icon={<InfoIcon />} label="Metadata" />
              <Tab icon={<BuildIcon />} label="Maintenance" />
              <Tab icon={<SettingsIcon />} label="Operations" />
              <Tab icon={<LinkIcon />} label="Advanced" />
            </Tabs>

            {/* Basic Info Tab */}
            {editActiveTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      autoFocus
                      margin="dense"
                      label="Name"
                      name="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      fullWidth
                      variant="outlined"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={DIGITAL_TWIN_TYPES}
                      value={editForm.type as DigitalTwinType}
                      onChange={(event, newValue) => {
                        setEditForm({ ...editForm, type: newValue as DigitalTwinType });
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Digital Twin Type" variant="outlined" required />
                      )}
                      isOptionEqualToValue={(option, value) => option === value}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                        label="Status"
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                        <MenuItem value="error">Error</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      margin="dense"
                      label="Version"
                      name="version"
                      value={editForm.version || ''}
                      onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      margin="dense"
                      label="Description"
                      name="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      fullWidth
                      multiline
                      rows={4}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Location Tab */}
            {editActiveTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Location Information</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Address"
                      name="location.address"
                      value={editForm.location?.address || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        location: { ...editForm.location, address: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="City"
                      name="location.city"
                      value={editForm.location?.city || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        location: { ...editForm.location, city: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="State/Province"
                      name="location.state"
                      value={editForm.location?.state || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        location: { ...editForm.location, state: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Country"
                      name="location.country"
                      value={editForm.location?.country || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        location: { ...editForm.location, country: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Postal Code"
                      name="location.postalCode"
                      value={editForm.location?.postalCode || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        location: { ...editForm.location, postalCode: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Latitude"
                      name="location.latitude"
                      type="number"
                      value={editForm.location?.latitude || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        location: { ...editForm.location, latitude: parseFloat(e.target.value) || 0 }
                      })}
                      fullWidth
                      variant="outlined"
                      inputProps={{ step: "any" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Longitude"
                      name="location.longitude"
                      type="number"
                      value={editForm.location?.longitude || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        location: { ...editForm.location, longitude: parseFloat(e.target.value) || 0 }
                      })}
                      fullWidth
                      variant="outlined"
                      inputProps={{ step: "any" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Building/Floor"
                      name="location.building"
                      value={editForm.location?.building || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        location: { ...editForm.location, building: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Room/Zone"
                      name="location.room"
                      value={editForm.location?.room || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        location: { ...editForm.location, room: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Metadata Tab */}
            {editActiveTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Asset Metadata</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Manufacturer"
                      name="assetMetadata.manufacturer"
                      value={editForm.assetMetadata?.manufacturer || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        assetMetadata: { ...editForm.assetMetadata, manufacturer: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Model"
                      name="assetMetadata.model"
                      value={editForm.assetMetadata?.model || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        assetMetadata: { ...editForm.assetMetadata, model: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Serial Number"
                      name="assetMetadata.serialNumber"
                      value={editForm.assetMetadata?.serialNumber || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        assetMetadata: { ...editForm.assetMetadata, serialNumber: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Installation Date"
                      type="date"
                      value={editForm.assetMetadata?.installationDate ? (editForm.assetMetadata?.installationDate || '').split('T')[0] : ''}
                      onChange={(e) => {
                        setEditForm({
                          ...editForm,
                          assetMetadata: {
                            ...editForm.assetMetadata,
                            installationDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                          }
                        });
                      }}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Firmware Version"
                      name="assetMetadata.firmwareVersion"
                      value={editForm.assetMetadata?.firmwareVersion || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        assetMetadata: { ...editForm.assetMetadata, firmwareVersion: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Software Version"
                      name="assetMetadata.softwareVersion"
                      value={editForm.assetMetadata?.softwareVersion || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        assetMetadata: { ...editForm.assetMetadata, softwareVersion: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Hardware Version"
                      name="assetMetadata.hardwareVersion"
                      value={editForm.assetMetadata?.hardwareVersion || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        assetMetadata: { ...editForm.assetMetadata, hardwareVersion: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Owner"
                      name="assetMetadata.owner"
                      value={editForm.assetMetadata?.owner || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        assetMetadata: { ...editForm.assetMetadata, owner: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Asset Notes"
                      name="assetMetadata.notes"
                      value={editForm.assetMetadata?.notes || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        assetMetadata: { ...editForm.assetMetadata, notes: e.target.value }
                      })}
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Maintenance Tab */}
            {editActiveTab === 3 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Maintenance Information</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Last Maintenance Date"
                      type="date"
                      value={editForm.maintenanceInfo?.lastMaintenanceDate ? (editForm.maintenanceInfo?.lastMaintenanceDate || '').split('T')[0] : ''}
                      onChange={(e) => {
                        setEditForm({
                          ...editForm,
                          maintenanceInfo: {
                            ...editForm.maintenanceInfo,
                            lastMaintenanceDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                          }
                        });
                      }}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Next Maintenance Date"
                      type="date"
                      value={editForm.maintenanceInfo?.nextMaintenanceDate ? (editForm.maintenanceInfo?.nextMaintenanceDate || '').split('T')[0] : ''}
                      onChange={(e) => {
                        setEditForm({
                          ...editForm,
                          maintenanceInfo: {
                            ...editForm.maintenanceInfo,
                            nextMaintenanceDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                          }
                        });
                      }}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Maintenance Interval (days)"
                      name="maintenanceInfo.maintenanceInterval"
                      type="number"
                      value={editForm.maintenanceInfo?.maintenanceInterval || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        maintenanceInfo: { ...editForm.maintenanceInfo, maintenanceInterval: parseInt(e.target.value) || 0 }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Warranty End Date"
                      name="maintenanceInfo.warrantyEndDate"
                      type="date"
                      value={editForm.maintenanceInfo?.warrantyEndDate || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        maintenanceInfo: { ...editForm.maintenanceInfo, warrantyEndDate: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Support Contact"
                      name="maintenanceInfo.supportContact"
                      value={editForm.maintenanceInfo?.supportContact || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        maintenanceInfo: { ...editForm.maintenanceInfo, supportContact: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Maintenance Notes"
                      name="maintenanceInfo.maintenanceNotes"
                      value={editForm.maintenanceInfo?.maintenanceNotes || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        maintenanceInfo: { ...editForm.maintenanceInfo, maintenanceNotes: e.target.value }
                      })}
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Operations Tab */}
            {editActiveTab === 4 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Operational Settings</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Reporting Interval (seconds)"
                      name="operationalSettings.reportingInterval"
                      type="number"
                      value={editForm.operationalSettings?.reportingInterval || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        operationalSettings: { ...editForm.operationalSettings, reportingInterval: parseInt(e.target.value) || 0 }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Energy Source</InputLabel>
                      <Select
                        name="operationalSettings.energySource"
                        value={editForm.operationalSettings?.energySource || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          operationalSettings: { ...editForm.operationalSettings, energySource: e.target.value }
                        })}
                        label="Energy Source"
                      >
                        <MenuItem value="electric">Electric</MenuItem>
                        <MenuItem value="battery">Battery</MenuItem>
                        <MenuItem value="solar">Solar</MenuItem>
                        <MenuItem value="hybrid">Hybrid</MenuItem>
                        <MenuItem value="manual">Manual</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Power Consumption (W)"
                      name="operationalSettings.powerConsumption"
                      type="number"
                      value={editForm.operationalSettings?.powerConsumption || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        operationalSettings: { ...editForm.operationalSettings, powerConsumption: parseFloat(e.target.value) || 0 }
                      })}
                      fullWidth
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Operating Temperature Range (°C)"
                      name="operationalSettings.operatingTemperatureRange"
                      value={editForm.operationalSettings?.operatingTemperatureRange || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        operationalSettings: { ...editForm.operationalSettings, operatingTemperatureRange: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                      placeholder="e.g., -10 to 50"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Network Protocol</InputLabel>
                      <Select
                        name="operationalSettings.networkProtocol"
                        value={editForm.operationalSettings?.networkProtocol || ''}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          operationalSettings: { ...editForm.operationalSettings, networkProtocol: e.target.value }
                        })}
                        label="Network Protocol"
                      >
                        <MenuItem value="HTTP">HTTP</MenuItem>
                        <MenuItem value="HTTPS">HTTPS</MenuItem>
                        <MenuItem value="MQTT">MQTT</MenuItem>
                        <MenuItem value="CoAP">CoAP</MenuItem>
                        <MenuItem value="WebSocket">WebSocket</MenuItem>
                        <MenuItem value="LoRaWAN">LoRaWAN</MenuItem>
                        <MenuItem value="Zigbee">Zigbee</MenuItem>
                        <MenuItem value="Bluetooth">Bluetooth</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Data Format"
                      name="operationalSettings.dataFormat"
                      value={editForm.operationalSettings?.dataFormat || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        operationalSettings: { ...editForm.operationalSettings, dataFormat: e.target.value }
                      })}
                      fullWidth
                      variant="outlined"
                      placeholder="e.g., JSON, XML, CSV"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Advanced Tab */}
            {editActiveTab === 5 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Advanced Configuration</Typography>
                
                {/* Custom Properties */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>Custom Properties</Typography>
                  <List>
                    {(editForm.customProperties || []).map((property, index) => (
                      <ListItem key={index}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={5}>
                            <TextField
                              label="Property Name"
                              value={property.name || ''}
                              onChange={(e) => {
                                const newProperties = [...(editForm.customProperties || [])];
                                newProperties[index].name = e.target.value;
                                setEditForm({ ...editForm, customProperties: newProperties });
                              }}
                              fullWidth
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={5}>
                            <TextField
                              label="Property Value"
                              value={property.value}
                              onChange={(e) => {
                                const newProperties = [...(editForm.customProperties || [])];
                                newProperties[index].value = e.target.value;
                                setEditForm({ ...editForm, customProperties: newProperties });
                              }}
                              fullWidth
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={2}>
                            <IconButton
                              onClick={() => {
                                const newProperties = (editForm.customProperties || []).filter((_, i) => i !== index);
                                setEditForm({ ...editForm, customProperties: newProperties });
                              }}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        customProperties: [...(editForm.customProperties || []), { name: '', value: '', type: 'string' }]
                      });
                    }}
                    variant="outlined"
                    sx={{ mt: 1 }}
                  >
                    Add Custom Property
                  </Button>
                </Box>

                {/* Commands */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Available Commands</Typography>
                  <List>
                    {(editForm.commands || []).map((command, index) => (
                      <ListItem key={index}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={4}>
                            <TextField
                              label="Command Name"
                              value={command.name}
                              onChange={(e) => {
                                const newCommands = [...(editForm.commands || [])];
                                newCommands[index].name = e.target.value;
                                setEditForm({ ...editForm, commands: newCommands });
                              }}
                              fullWidth
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Description"
                              value={command.description}
                              onChange={(e) => {
                                const newCommands = [...(editForm.commands || [])];
                                newCommands[index].description = e.target.value;
                                setEditForm({ ...editForm, commands: newCommands });
                              }}
                              fullWidth
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={2}>
                            <IconButton
                              onClick={() => {
                                const newCommands = (editForm.commands || []).filter((_, i) => i !== index);
                                setEditForm({ ...editForm, commands: newCommands });
                              }}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    startIcon={<PlayIcon />}
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        commands: [...(editForm.commands || []), { id: `cmd-${Date.now()}`, name: '', description: '', parameters: {} }]
                      });
                    }}
                    variant="outlined"
                    sx={{ mt: 1 }}
                  >
                    Add Command
                  </Button>
                </Box>
              </Box>
            )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialog({ open: false, twin: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={actionLoading}
            sx={{ bgcolor: '#1976d2' }}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, twin: null })}>
        <DialogTitle>Delete Digital Twin</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.twin?.attributes.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialog({ open: false, twin: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          bgcolor: '#1976d2',
          '&:hover': { bgcolor: '#1565c0' },
        }}
        onClick={() => navigate('/create')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default Things;