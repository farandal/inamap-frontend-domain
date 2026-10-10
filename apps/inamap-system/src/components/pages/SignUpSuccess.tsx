import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import { useTranslate } from '../hooks/usePolyglotTranslation';

const SignUpSuccess = (props) => {
    const translate = useTranslate();
    const location = useLocation();
    const navigate = useNavigate();
    // Defaults to true so an older backend (or a direct navigation to this
    // URL with no router state) keeps the original "check your email" copy -
    // the pre-flag behaviour - rather than silently claiming no verification
    // is needed.
    const { email, planName, verificationRequired = true } = location.state || {};

    const displayPlanName = planName || translate('signup.success.defaultPlanName', { defaultValue: 'Trial' });

    return (
        <Box className='dash-signup-success'>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                    textAlign: "center"
                }}>
                <Card sx={{ maxWidth: 500, width: '100%', mt: 30, mb: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <CheckCircleIcon 
                            sx={{ fontSize: 64, color: 'success.main', mb: 2 }} 
                        />
                        
                        <Typography variant="h4" gutterBottom sx={{
                            color: "success.main"
                        }}>
                            {translate('signup.success.title')}
                        </Typography>
                        
                        <Typography variant="body1" sx={{
                            marginBottom: "16px"
                        }}>
                            {translate('signup.success.welcome', { planName: displayPlanName })}
                        </Typography>

                        {email && verificationRequired && (
                            <Alert 
                                severity="info" 
                                icon={<EmailIcon />}
                                sx={{ mb: 3, textAlign: 'left' }}
                            >
                                <Typography variant="body2">
                                    {translate('signup.success.verificationSent', { email: email })}
                                </Typography>
                            </Alert>
                        )}

                        {!verificationRequired && (
                            <Alert
                                severity="success"
                                sx={{ mb: 3, textAlign: 'left' }}
                            >
                                <Typography variant="body2">
                                    {translate('signup.success.noVerificationNeeded', {
                                        defaultValue:
                                            'Your account is being set up and will be ready shortly. No email verification is required - you can sign in once setup finishes.',
                                    })}
                                </Typography>
                            </Alert>
                        )}

                        <Typography variant="body2" color="textSecondary" sx={{
                            marginBottom: "16px"
                        }}>
                            {translate('signup.success.description')}
                        </Typography>

                        <Box sx={{
                            mt: 3
                        }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => navigate('/login')}
                                sx={{ mr: 2 }}
                            >
                                {translate('signup.success.loginButton')}
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => navigate('/')}
                            >
                                {translate('signup.success.home_button')}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default SignUpSuccess;
