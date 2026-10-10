import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Alert,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Payment as StripeIcon,
    AccountBalanceWallet as PayPalIcon,
    CreditCard as CardIcon,
} from '@mui/icons-material';

/**
 * PaymentGatewayIntegration
 * 
 * Placeholder component documenting integration points for payment gateways.
 * The backend supports PaymentGatewayContract which allows extensible gateway implementations.
 * 
 * Currently available:
 * - InternalPaymentGatewayService (simulation/testing)
 * 
 * Future integrations:
 * - Stripe
 * - PayPal
 * - MercadoPago
 * - etc.
 * 
 * Integration Steps:
 * 1. Backend: Implement PaymentGatewayContract for the gateway
 * 2. Backend: Register gateway in SystemPaymentGateway::getAvailableClasses()
 * 3. Backend: Configure TenancySystemPaymentGateway for the tenancy
 * 4. Frontend: Create gateway-specific setup component (e.g., Stripe Elements)
 * 5. Frontend: Handle payment method tokenization
 * 6. Frontend: Submit tokenized payment method to backend
 */

interface GatewayInfo {
    name: string;
    icon: React.ReactNode;
    status: 'available' | 'coming_soon' | 'in_development';
    description: string;
}

const gateways: GatewayInfo[] = [
    {
        name: 'Internal (Demo)',
        icon: <CardIcon />,
        status: 'available',
        description: 'Simulation gateway for testing and demo purposes',
    },
    {
        name: 'Stripe',
        icon: <StripeIcon />,
        status: 'coming_soon',
        description: 'Full-featured payment processing with cards, wallets, and more',
    },
    {
        name: 'PayPal',
        icon: <PayPalIcon />,
        status: 'coming_soon',
        description: 'PayPal checkout and recurring payments',
    },
];

const PaymentGatewayIntegration: React.FC = () => {
    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
                Payment Gateway Integration
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                Payment gateway integration is configured at the system level. 
                Contact your administrator to enable additional payment methods.
            </Alert>

            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Available Gateways
                    </Typography>

                    <List>
                        {gateways.map((gateway, index) => (
                            <ListItem key={index} divider={index < gateways.length - 1}>
                                <ListItemIcon>{gateway.icon}</ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {gateway.name}
                                            {gateway.status === 'coming_soon' && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        px: 1,
                                                        py: 0.25,
                                                        bgcolor: 'warning.light',
                                                        color: 'warning.contrastText',
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    Coming Soon
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                    secondary={gateway.description}
                                />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Developer Notes
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    To add a new payment gateway:
                </Typography>
                <Typography variant="body2" component="ol" sx={{ pl: 2, color: 'text.secondary' }}>
                    <li>Implement PaymentGatewayContract in the backend</li>
                    <li>Register the gateway in SystemPaymentGateway</li>
                    <li>Configure TenancySystemPaymentGateway for each tenancy</li>
                    <li>Create frontend components for payment method collection</li>
                </Typography>
            </Box>
        </Box>
    );
};

export default PaymentGatewayIntegration;
