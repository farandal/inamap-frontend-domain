/**
 * Dashboard Component
 * 
 * This component renders at the root path ("/") for authenticated users.
 * Pass this to WebPrivateApp's `dashboard` prop to prevent
 * react-admin from redirecting "/" to the first resource.
 */
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useAuthenticated, useTranslate } from 'react-admin';
import { AppDashboardGrid } from 'dash-admin';


const Dashboard: React.FC = () => {
    // Ensure user is authenticated
    useAuthenticated();
    const translate = useTranslate();

    return (
        <Box sx={{ p: 2 }}>
            <Paper sx={{ p: 3, mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                    {translate('dashboard.title')}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    {translate('dashboard.welcome')}
                </Typography>
            </Paper>

            <AppDashboardGrid columns={{ xs: 2, sm: 3, md: 4, lg: 6 }} size="large" gap={2} />
        </Box>
    );
};

export default Dashboard;
