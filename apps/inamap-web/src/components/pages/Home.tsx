import React from 'react';
import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CropFreeIcon from '@mui/icons-material/CropFree';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccessibleForwardIcon from '@mui/icons-material/AccessibleForward';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import PreReleaseHero from '../prerelease/PreReleaseHero';
import { isPreRelease } from '@app/utils/releaseStage';
import { useTranslate } from '../hooks/usePolyglotTranslation';

/**
 * Portada pública de INAMAP (inamap-web): qué es, qué resuelve y cómo empezar
 * (registro de prueba → editor de mapas).
 */

const RED = '#E1251B';

const HeroMap: React.FC = () => (
    <svg viewBox="0 0 520 360" width="100%" role="img" aria-label="Mapa de ejemplo con ruta" style={{ filter: 'drop-shadow(0 18px 40px rgba(0,0,0,.25))' }}>
        <rect width="520" height="360" rx="18" fill="#f8fafc" />
        <g stroke="#e2e8f0">
            {Array.from({ length: 13 }, (_, i) => (
                <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={360} />
            ))}
            {Array.from({ length: 9 }, (_, i) => (
                <line key={`h${i}`} x1={0} y1={i * 40} x2={520} y2={i * 40} />
            ))}
        </g>
        <rect x="40" y="200" width="150" height="110" rx="4" fill="#3b82f6" fillOpacity=".55" stroke="#1d4ed8" strokeWidth="2" />
        <rect x="330" y="40" width="140" height="100" rx="4" fill="#3b82f6" fillOpacity=".55" stroke="#1d4ed8" strokeWidth="2" />
        <polygon points="180,50 300,45 315,140 220,170 170,130" fill="#22c55e" fillOpacity=".35" stroke="#16a34a" strokeWidth="2" strokeDasharray="8 5" />
        <rect x="320" y="210" width="160" height="110" rx="4" fill="#ef4444" fillOpacity=".35" stroke="#dc2626" strokeWidth="2" />
        <path d="M110 330 V 175 H 300 V 175 H 400 V 160" fill="none" stroke={RED} strokeWidth="5" strokeDasharray="14 10" strokeLinecap="round">
            <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="1s" repeatCount="indefinite" />
        </path>
        <circle cx="110" cy="330" r="9" fill="#16a34a" stroke="#fff" strokeWidth="3" />
        <path d="M400 160 c-4-10-14-15-14-26 a14 14 0 1 1 28 0 c0 11-10 16-14 26 z" fill={RED} stroke="#fff" strokeWidth="2" />
        <circle cx="400" cy="134" r="5" fill="#fff" />
    </svg>
);

const features = [
    { icon: <CropFreeIcon />, title: 'Editor de mapas', text: 'Suba el plano de cada piso y dibuje zonas, estructuras, ubicaciones y caminos sobre un lienzo en metros.' },
    { icon: <AltRouteIcon />, title: 'Rutas automáticas', text: 'Calcule la ruta óptima de A a B respetando sentidos de circulación, incluso entre pisos por ascensores, rampas o escaleras.' },
    { icon: <AccessibleForwardIcon />, title: 'Rutas accesibles', text: 'Con un clic la ruta evita escaleras y escaleras mecánicas para personas con movilidad reducida.' },
    { icon: <TravelExploreIcon />, title: 'Búsqueda inteligente', text: 'Los visitantes encuentran lugares por nombre, código, categoría o términos, aunque escriban con errores.' },
    { icon: <QrCode2Icon />, title: 'QR y kioscos', text: 'Lleve la ruta al celular del visitante con un código QR, desde la web o desde pantallas del recinto.' },
    { icon: <LayersOutlinedIcon />, title: 'Multi-recinto', text: 'Administre varios recintos y clientes desde una misma cuenta, con usuarios, roles y planes.' },
];

export default function Home() {
    const navigate = useNavigate();
    const translate = useTranslate();

    if (isPreRelease()) {
        return <PreReleaseHero />;
    }

    return (
        <Box sx={{  }}>
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                <Grid container spacing={6} alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: 36, md: 52 }, lineHeight: 1.1 }}>
                            Que nadie se pierda en <Box component="span" sx={{ color: RED }}>tu recinto</Box>.
                        </Typography>
                        <Typography sx={{ mt: 3, fontSize: 18, color: '#cbd5e1' }}>
                            INAMAP convierte los planos de tu campus, feria, edificio o evento en mapas interactivos con búsqueda y rutas paso a paso,
                            listos para la web, el celular de tus visitantes y los kioscos del lugar.
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
                            <Button size="large" variant="contained" sx={{ bgcolor: RED, '&:hover': { bgcolor: '#b91c1c' } }} onClick={() => navigate('/signup')}>
                                {translate('ina_web.home.cta_signup', { _: 'Comenzar gratis' })}
                            </Button>
                            <Button size="large" variant="outlined" sx={{ color: '#fff', borderColor: '#475569' }} onClick={() => navigate('/plans')}>
                                {translate('ina_web.home.cta_plans', { _: 'Ver planes' })}
                            </Button>
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <HeroMap />
                    </Grid>
                </Grid>
            </Container>

            <Box sx={{ bgcolor: '#fff', color: '#0f172a', py: { xs: 8, md: 10 } }}>
                <Container maxWidth="lg">
                    <Typography variant="h4" sx={{ fontWeight: 800, textAlign: "center" }}>
                        Todo lo necesario para orientar a tus visitantes
                    </Typography>
                    <Grid container spacing={3} sx={{ mt: 4 }}>
                        {features.map((f) => (
                            <Grid key={f.title} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Box sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#fee2e2', color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.icon}</Box>
                                    <Typography sx={{ fontWeight: 700, mt: 2 }}>
                                        {f.title}
                                    </Typography>
                                    <Typography sx={{ mt: 1, color: '#475569' }}>{f.text}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
}
