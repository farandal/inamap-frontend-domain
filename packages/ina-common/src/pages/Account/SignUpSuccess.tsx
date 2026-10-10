import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import FullLayoutMarkup from 'dash-admin/src/default-theme/FullLayoutMarkup';
import { useDispatch } from 'react-redux';
import { DASH_REDUX_ACTIONS } from 'dash-admin-state';

const SignUpSuccess = (props) => {

    const {panelSettings} = props;
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { email, planName } = location.state || {};

    useEffect(() => {
        dispatch(
            DASH_REDUX_ACTIONS.updatePage({
                title: null,
            }),
        );
    }, []);

    return (
        <FullLayoutMarkup className='dash-signup-success w50' logo={panelSettings?.horizontalLogo} loginBackground={panelSettings?.loginBackground}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "60vh",
                    textAlign: "center"
                }}>
                <Card sx={{ maxWidth: 500, width: '100%',mt:30, mb: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <CheckCircleIcon 
                            sx={{ fontSize: 64, color: 'success.main', mb: 2 }} 
                        />
                        
                        <Typography variant="h4" gutterBottom sx={{
                            color: "success.main"
                        }}>
                            ¡Cuenta Creada Exitosamente!
                        </Typography>
                        
                        <Typography variant="body1" sx={{
                            marginBottom: "16px"
                        }}>
                            ¡Bienvenido! Tu cuenta ha sido creada
                            <strong>{planName || 'seleccionado'}</strong>.
                        </Typography>

                        {email && (
                            <Alert 
                                severity="info" 
                                icon={<EmailIcon />}
                                sx={{ mb: 3, textAlign: 'left' }}
                            >
                                <Typography variant="body2">
                                    Hemos enviado un correo de verificación a <strong>{email}</strong>. 
                                    Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta.
                                </Typography>
                            </Alert>
                        )}

                        <Typography variant="body2" color="textSecondary" sx={{
                            marginBottom: "16px"
                        }}>
                            Ahora puedes iniciar sesión en tu cuenta y comenzar a usar todas las funciones incluidas en tu plan.
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
                                Ir a Iniciar Sesión
                            </Button>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() => navigate('/')}
                            >
                                Volver al Inicio
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </FullLayoutMarkup>
    );
};

export default SignUpSuccess;
