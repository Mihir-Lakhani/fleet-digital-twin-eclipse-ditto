import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DeviceHub as ActiveIcon,
  PowerOff as InactiveIcon,
  Build as MaintenanceIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { apiService } from '../api';
import { DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const loadStats = async () => {
    try {
      setError(null);
      const data = await apiService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      if (err.isOffline || err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        // Offline mode - don't show error popup, just set offline message
        setStats({
          totalTwins: 0,
          activeTwins: 0,
          inactiveTwins: 0,
          maintenanceTwins: 0,
          errorTwins: 0,
        });
        setError('Backend services are offline. Start Docker services to connect.');
        console.log('Dashboard in offline mode');
      } else {
        const errorMessage = 'Failed to load dashboard statistics';
        setError(errorMessage);
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadStats();
    if (!error || !error.includes('offline')) {
      enqueueSnackbar('Dashboard refreshed', { variant: 'success' });
    } else {
      enqueueSnackbar('Refreshed - Backend still offline', { variant: 'info' });
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Digital Twins',
      value: stats?.totalTwins || 0,
      icon: <DashboardIcon />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Active',
      value: stats?.activeTwins || 0,
      icon: <ActiveIcon />,
      color: '#2e7d32',
      bgColor: '#e8f5e8',
    },
    {
      title: 'Inactive',
      value: stats?.inactiveTwins || 0,
      icon: <InactiveIcon />,
      color: '#757575',
      bgColor: '#f5f5f5',
    },
    {
      title: 'Maintenance',
      value: stats?.maintenanceTwins || 0,
      icon: <MaintenanceIcon />,
      color: '#ed6c02',
      bgColor: '#fff3e0',
    },
    {
      title: 'Error',
      value: stats?.errorTwins || 0,
      icon: <ErrorIcon />,
      color: '#d32f2f',
      bgColor: '#ffebee',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <IconButton color="inherit" size="small" onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        }
        sx={{ mb: 3 }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={4} sx={{ width: '100%' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 1 }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor your digital twin ecosystem in real-time
          </Typography>
        </Box>
        <IconButton 
          onClick={handleRefresh}
          sx={{ 
            bgcolor: '#1976d2',
            color: 'white',
            '&:hover': { bgcolor: '#1565c0' }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4} sx={{ width: '100%', mx: -1.5 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card
              sx={{
                height: '160px',
                background: `linear-gradient(135deg, ${card.bgColor} 0%, ${card.bgColor}80 100%)`,
                border: `1px solid ${card.color}20`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 32px ${card.color}20`,
                },
              }}
            >
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" justifyContent="between" alignItems="flex-start" mb={2}>
                  <Avatar
                    sx={{
                      bgcolor: card.color,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <TrendingUpIcon sx={{ color: card.color, opacity: 0.7 }} />
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: card.color,
                    mb: 0.5,
                  }}
                >
                  {card.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    fontWeight: 500,
                  }}
                >
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Summary Card */}
      <Card sx={{ mb: 3, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#1a1a1a' }}>
            System Health Summary
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box>
                <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
                  Your digital twin network is operating smoothly. Here's what's happening:
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    📊 System Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats?.totalTwins === 0 
                      ? 'No digital twins created yet. Start by creating your first twin!'
                      : `Managing ${stats?.totalTwins} digital twin${stats?.totalTwins !== 1 ? 's' : ''} across your network.`
                    }
                  </Typography>
                </Box>

                {stats && stats.totalTwins > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                      🎯 Performance Metrics
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {((stats.activeTwins / stats.totalTwins) * 100).toFixed(1)}% of your twins are currently active and operational.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 3,
                  bgcolor: '#f8fafc',
                  borderRadius: 2,
                  border: '1px solid #e0e7ff',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
                  Quick Actions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  • View all digital twins in Things page
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  • Create new twins in Create page
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Monitor real-time status updates
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />

      {/* Footer Info */}
      <Box textAlign="center" py={2}>
        <Typography variant="body2" color="text.secondary">
          Digital Twin Management System • Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;