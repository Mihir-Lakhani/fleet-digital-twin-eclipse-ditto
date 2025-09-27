import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Chip,
  Autocomplete,

  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Build as BuildIcon,
  LocationOn as LocationIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { apiService } from '../api';
import { 
  CreateTwinRequest, 
  DIGITAL_TWIN_TYPES, 
  DigitalTwinType,
  CustomProperty,
  Command,
} from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`create-twin-tabpanel-${index}`}
      aria-labelledby={`create-twin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Create: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Form state
  const [form, setForm] = useState<CreateTwinRequest>({
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

  // UI state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [tagInput, setTagInput] = useState('');
  const [commandDialog, setCommandDialog] = useState<{ open: boolean; command?: Command }>({ open: false });
  const [propertyDialog, setPropertyDialog] = useState<{ open: boolean; property?: CustomProperty & { index?: number } }>({ open: false });

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!form.name?.trim()) newErrors.name = 'Name is required';
    if (!form.type) newErrors.type = 'Type is required';

    // Validate location coordinates
    if (form.location?.latitude && (form.location.latitude < -90 || form.location.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }
    if (form.location?.longitude && (form.location.longitude < -180 || form.location.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
    }

    // Validate safety limits
    if (form.operationalSettings?.safetyLimits?.minTemperature && 
        form.operationalSettings?.safetyLimits?.maxTemperature &&
        form.operationalSettings.safetyLimits.minTemperature >= form.operationalSettings.safetyLimits.maxTemperature) {
      newErrors.temperatureRange = 'Min temperature must be less than max temperature';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      enqueueSnackbar('Please fix the form errors', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await apiService.createTwin(form);
      enqueueSnackbar('Digital twin created successfully!', { variant: 'success' });
      navigate('/things');
    } catch (err: any) {
      if (err.isOffline || err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        enqueueSnackbar('Cannot create twin - Backend services are offline. Start Docker services first.', { variant: 'warning' });
      } else {
        enqueueSnackbar('Failed to create digital twin', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags?.includes(tagInput.trim())) {
      setForm({
        ...form,
        tags: [...(form.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setForm({
      ...form,
      tags: form.tags?.filter(tag => tag !== tagToRemove) || [],
    });
  };

  const handleAddCustomProperty = (property: CustomProperty) => {
    const newProperties = [...(form.customProperties || [])];
    if (propertyDialog.property?.index !== undefined) {
      newProperties[propertyDialog.property.index] = property;
    } else {
      newProperties.push(property);
    }
    setForm({ ...form, customProperties: newProperties });
    setPropertyDialog({ open: false });
  };

  const handleRemoveCustomProperty = (index: number) => {
    setForm({
      ...form,
      customProperties: form.customProperties?.filter((_, i) => i !== index) || [],
    });
  };

  const handleAddCommand = (command: Command) => {
    const newCommands = [...(form.commands || [])];
    const existingIndex = newCommands.findIndex(c => c.id === command.id);
    if (existingIndex >= 0) {
      newCommands[existingIndex] = command;
    } else {
      newCommands.push(command);
    }
    setForm({ ...form, commands: newCommands });
    setCommandDialog({ open: false });
  };

  const handleRemoveCommand = (commandId: string) => {
    setForm({
      ...form,
      commands: form.commands?.filter(c => c.id !== commandId) || [],
    });
  };

  const renderBasicInfoTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={!!errors.name}
          helperText={errors.name}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required error={!!errors.type}>
          <Autocomplete
            value={form.type}
            onChange={(_, value) => setForm({ ...form, type: value as DigitalTwinType })}
            options={DIGITAL_TWIN_TYPES}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Type"
                error={!!errors.type}
                helperText={errors.type}
                required
              />
            )}
          />
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
            label="Status"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="error">Error</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Description"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          multiline
          rows={3}
          helperText="Detailed description of the digital twin"
        />
      </Grid>

      {/* Tags Section */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>Tags</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {form.tags?.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              onDelete={() => handleRemoveTag(tag)}
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            label="Add Tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <Button onClick={handleAddTag} variant="outlined" startIcon={<AddIcon />}>
            Add
          </Button>
        </Box>
      </Grid>
    </Grid>
  );

  const renderLocationTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Location Information
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Latitude"
          value={form.location?.latitude || ''}
          onChange={(e) => setForm({
            ...form,
            location: { ...form.location, latitude: parseFloat(e.target.value) }
          })}
          error={!!errors.latitude}
          helperText={errors.latitude || 'Decimal degrees (-90 to 90)'}
          inputProps={{ step: 'any', min: -90, max: 90 }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Longitude"
          value={form.location?.longitude || ''}
          onChange={(e) => setForm({
            ...form,
            location: { ...form.location, longitude: parseFloat(e.target.value) }
          })}
          error={!!errors.longitude}
          helperText={errors.longitude || 'Decimal degrees (-180 to 180)'}
          inputProps={{ step: 'any', min: -180, max: 180 }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Address"
          value={form.location?.address || ''}
          onChange={(e) => setForm({
            ...form,
            location: { ...form.location, address: e.target.value }
          })}
          multiline
          rows={2}
          helperText="Full address or location description"
        />
      </Grid>
    </Grid>
  );

  const renderMetadataTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Asset Metadata
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Manufacturer"
          value={form.assetMetadata?.manufacturer || ''}
          onChange={(e) => setForm({
            ...form,
            assetMetadata: { ...form.assetMetadata, manufacturer: e.target.value }
          })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Model Number"
          value={form.assetMetadata?.modelNumber || ''}
          onChange={(e) => setForm({
            ...form,
            assetMetadata: { ...form.assetMetadata, modelNumber: e.target.value }
          })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Serial Number"
          value={form.assetMetadata?.serialNumber || ''}
          onChange={(e) => setForm({
            ...form,
            assetMetadata: { ...form.assetMetadata, serialNumber: e.target.value }
          })}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="date"
          label="Installation Date"
          value={form.assetMetadata?.installationDate || ''}
          onChange={(e) => setForm({
            ...form,
            assetMetadata: { ...form.assetMetadata, installationDate: e.target.value }
          })}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="date"
          label="Warranty Expiration Date"
          value={form.assetMetadata?.warrantyExpirationDate || ''}
          onChange={(e) => setForm({
            ...form,
            assetMetadata: { ...form.assetMetadata, warrantyExpirationDate: e.target.value }
          })}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );

  const renderMaintenanceTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          <BuildIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Maintenance Information
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="date"
          label="Last Maintenance Date"
          value={form.maintenanceInfo?.lastMaintenanceDate || ''}
          onChange={(e) => setForm({
            ...form,
            maintenanceInfo: { ...form.maintenanceInfo, lastMaintenanceDate: e.target.value }
          })}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="date"
          label="Next Scheduled Maintenance"
          value={form.maintenanceInfo?.nextScheduledMaintenanceDate || ''}
          onChange={(e) => setForm({
            ...form,
            maintenanceInfo: { ...form.maintenanceInfo, nextScheduledMaintenanceDate: e.target.value }
          })}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Maintenance Notes"
          value={form.maintenanceInfo?.maintenanceNotes || ''}
          onChange={(e) => setForm({
            ...form,
            maintenanceInfo: { ...form.maintenanceInfo, maintenanceNotes: e.target.value }
          })}
          multiline
          rows={4}
          helperText="Detailed maintenance history and notes"
        />
      </Grid>
    </Grid>
  );

  const renderOperationsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Operational Settings
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Operating Mode</InputLabel>
          <Select
            value={form.operationalSettings?.operatingMode || 'auto'}
            onChange={(e) => setForm({
              ...form,
              operationalSettings: { 
                ...form.operationalSettings, 
                operatingMode: e.target.value as any 
              }
            })}
            label="Operating Mode"
          >
            <MenuItem value="auto">Automatic</MenuItem>
            <MenuItem value="manual">Manual</MenuItem>
            <MenuItem value="off">Off</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Safety Limits */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>Safety Limits</Typography>
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Min Temperature (°C)"
          value={form.operationalSettings?.safetyLimits?.minTemperature || ''}
          onChange={(e) => setForm({
            ...form,
            operationalSettings: {
              ...form.operationalSettings,
              safetyLimits: {
                ...form.operationalSettings?.safetyLimits,
                minTemperature: parseFloat(e.target.value) || undefined
              }
            }
          })}
          error={!!errors.temperatureRange}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Max Temperature (°C)"
          value={form.operationalSettings?.safetyLimits?.maxTemperature || ''}
          onChange={(e) => setForm({
            ...form,
            operationalSettings: {
              ...form.operationalSettings,
              safetyLimits: {
                ...form.operationalSettings?.safetyLimits,
                maxTemperature: parseFloat(e.target.value) || undefined
              }
            }
          })}
          error={!!errors.temperatureRange}
          helperText={errors.temperatureRange}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Min Pressure (Pa)"
          value={form.operationalSettings?.safetyLimits?.minPressure || ''}
          onChange={(e) => setForm({
            ...form,
            operationalSettings: {
              ...form.operationalSettings,
              safetyLimits: {
                ...form.operationalSettings?.safetyLimits,
                minPressure: parseFloat(e.target.value) || undefined
              }
            }
          })}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <TextField
          fullWidth
          type="number"
          label="Max Pressure (Pa)"
          value={form.operationalSettings?.safetyLimits?.maxPressure || ''}
          onChange={(e) => setForm({
            ...form,
            operationalSettings: {
              ...form.operationalSettings,
              safetyLimits: {
                ...form.operationalSettings?.safetyLimits,
                maxPressure: parseFloat(e.target.value) || undefined
              }
            }
          })}
        />
      </Grid>

      {/* Telemetry Overview */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>Telemetry Overview</Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Telemetry URL"
          value={form.telemetryOverview?.telemetryUrl || ''}
          onChange={(e) => setForm({
            ...form,
            telemetryOverview: { ...form.telemetryOverview, telemetryUrl: e.target.value }
          })}
          helperText="URL endpoint for telemetry data"
        />
      </Grid>

      {/* Relationships */}
      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom>
          <LinkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Relationships
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Parent Asset ID"
          value={form.relationships?.parentAssetId || ''}
          onChange={(e) => setForm({
            ...form,
            relationships: { ...form.relationships, parentAssetId: e.target.value }
          })}
          helperText="ID of parent digital twin"
        />
      </Grid>
    </Grid>
  );

  const renderAdvancedTab = () => (
    <Grid container spacing={3}>
      {/* Custom Properties */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Custom Properties</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={() => setPropertyDialog({ open: true })}
            variant="outlined"
          >
            Add Property
          </Button>
        </Box>
        <List>
          {form.customProperties?.map((property, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={property.key}
                secondary={`${property.value} (${property.type})`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  onClick={() => setPropertyDialog({ 
                    open: true, 
                    property: { ...property, index } 
                  })}
                  size="small"
                >
                  <InfoIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleRemoveCustomProperty(index)}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Grid>

      {/* Commands */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Commands</Typography>
          <Button
            startIcon={<PlayIcon />}
            onClick={() => setCommandDialog({ open: true })}
            variant="outlined"
          >
            Add Command
          </Button>
        </Box>
        <List>
          {form.commands?.map((command) => (
            <ListItem key={command.id} divider>
              <ListItemText
                primary={command.name}
                secondary={command.description}
              />
              <ListItemSecondaryAction>
                <IconButton
                  onClick={() => setCommandDialog({ open: true, command })}
                  size="small"
                >
                  <InfoIcon />
                </IconButton>
                <IconButton
                  onClick={() => handleRemoveCommand(command.id)}
                  size="small"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
        Create Digital Twin
      </Typography>

      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Basic Info" />
            <Tab label="Location" />
            <Tab label="Metadata" />
            <Tab label="Maintenance" />
            <Tab label="Operations" />
            <Tab label="Advanced" />
          </Tabs>
        </Box>

        <form onSubmit={handleSubmit}>
          <TabPanel value={activeTab} index={0}>
            {renderBasicInfoTab()}
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            {renderLocationTab()}
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            {renderMetadataTab()}
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            {renderMaintenanceTab()}
          </TabPanel>
          <TabPanel value={activeTab} index={4}>
            {renderOperationsTab()}
          </TabPanel>
          <TabPanel value={activeTab} index={5}>
            {renderAdvancedTab()}
          </TabPanel>

          <Box sx={{ p: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/things')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Creating...' : 'Create Twin'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Custom Property Dialog */}
      <PropertyDialog
        open={propertyDialog.open}
        property={propertyDialog.property}
        onSave={handleAddCustomProperty}
        onClose={() => setPropertyDialog({ open: false })}
      />

      {/* Command Dialog */}
      <CommandDialog
        open={commandDialog.open}
        command={commandDialog.command}
        onSave={handleAddCommand}
        onClose={() => setCommandDialog({ open: false })}
      />
    </Box>
  );
};

// Custom Property Dialog Component
const PropertyDialog: React.FC<{
  open: boolean;
  property?: CustomProperty & { index?: number };
  onSave: (property: CustomProperty) => void;
  onClose: () => void;
}> = ({ open, property, onSave, onClose }) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState<string | number | boolean>('');
  const [type, setType] = useState<'text' | 'number' | 'boolean'>('text');

  React.useEffect(() => {
    if (property) {
      setKey(property.key || '');
      setValue(property.value);
      // Convert 'string' type to 'text' for consistency
      setType(property.type === 'string' ? 'text' : property.type as 'text' | 'number' | 'boolean');
    } else {
      setKey('');
      setValue('');
      setType('text');
    }
  }, [property]);

  const handleSave = () => {
    if (key.trim()) {
      onSave({ key: key.trim(), value, type });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {property ? 'Edit Custom Property' : 'Add Custom Property'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Property Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={8}>
            <TextField
              fullWidth
              label="Value"
              value={value}
              onChange={(e) => {
                if (type === 'number') {
                  setValue(parseFloat(e.target.value) || 0);
                } else if (type === 'boolean') {
                  setValue(e.target.value === 'true');
                } else {
                  setValue(e.target.value);
                }
              }}
              type={type === 'number' ? 'number' : 'text'}
              required
            />
          </Grid>
          <Grid item xs={4}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as any);
                  setValue('');
                }}
                label="Type"
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="number">Number</MenuItem>
                <MenuItem value="boolean">Boolean</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {type === 'boolean' && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={value as boolean}
                    onChange={(e) => setValue(e.target.checked)}
                  />
                }
                label="Boolean Value"
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Command Dialog Component
const CommandDialog: React.FC<{
  open: boolean;
  command?: Command;
  onSave: (command: Command) => void;
  onClose: () => void;
}> = ({ open, command, onSave, onClose }) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (command) {
      setId(command.id);
      setName(command.name);
      setDescription(command.description || '');
    } else {
      setId('');
      setName('');
      setDescription('');
    }
  }, [command]);

  const handleSave = () => {
    if (id.trim() && name.trim()) {
      onSave({ 
        id: id.trim(), 
        name: name.trim(), 
        description: description.trim() || undefined 
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {command ? 'Edit Command' : 'Add Command'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Command ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              helperText="Unique identifier for the command"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Command Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Create;