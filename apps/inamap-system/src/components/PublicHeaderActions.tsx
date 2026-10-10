import React, {  } from 'react';
import { PropsWithChildren } from 'react';
import { Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LangSwitcher from './lang/LangSwitcher';
import DarkToggleMode from './lang/DarkToggleMode';
import { useTranslate } from './hooks/usePolyglotTranslation';

const PublicHeaderActions: React.FC<PropsWithChildren> = (props) => {
    
    const translate = useTranslate();
    const navigate = useNavigate();
    
    // Only keep header actions here, notifications are handled by NotificationsCenter
    return  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button onClick={() => navigate('/login')}>{translate('common.login')}</Button>
                <Button onClick={() => navigate('/signup')}>{translate('common.signup')}</Button>
                <LangSwitcher />
                <DarkToggleMode />
            </Box>
};

export default PublicHeaderActions; 