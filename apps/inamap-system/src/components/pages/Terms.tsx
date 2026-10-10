import React from 'react';
import { Box, Container, Paper } from '@mui/material';
import MDViewer from '../docs/MDViewer';

/**
 * Privacy Policy Page
 * Loads privacy.md based on the current locale
 */
const Terms: React.FC = () => {
    return (
        <Box 
            className="privacy-page"
            sx={{
                minHeight: '100vh',
                py: 4,
                backgroundColor: 'background.default',
            }}
        >
            <Container maxWidth="md">
                <Paper 
                    elevation={2}
                    sx={{ 
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}
                >
                    <MDViewer docPath="terms" />
                </Paper>
            </Container>
        </Box>
    );
};

export default Terms;
