import React from 'react';
import { PropsWithChildren } from 'react';

import { EchoNotificationsCenter, TenantSwitcher } from 'dash-admin';
import defaultHorizontalLogo from '../assets/logo-horizontal.svg';
import defaultSquaredLogo from '../assets/logo-squared.svg';
import defaultLoginBackground from '../assets/login-back.svg';

const DASHHeaderActions: React.FC<PropsWithChildren> = (props) => {
    return (
        <>
            <TenantSwitcher
                defaultHorizontalLogo={defaultHorizontalLogo}
                defaultSquaredLogo={defaultSquaredLogo}
                defaultLoginBackground={defaultLoginBackground}
            />
            <EchoNotificationsCenter />
        </>
    );
};

export default DASHHeaderActions;
