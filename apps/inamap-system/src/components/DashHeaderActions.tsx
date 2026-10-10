import React from 'react';
import { PropsWithChildren } from 'react';

import { EchoNotificationsCenter } from 'dash-admin';

const DASHHeaderActions: React.FC<PropsWithChildren> = (props) => {
    // Notifications are handled by the shared EchoNotificationsCenter (dash-admin),
    // which wires LaravelEchoContext into dash-components' NotificationsCenter.
    // No wrapper div here on purpose: SidebarActions lays its children out in a centered
    // flex column/row (align-items: center). A width: 100% wrapper with justifyContent:
    // 'flex-end' used to stretch to fill that flex track and shove the bell icon to one
    // edge instead of letting it center like its siblings (avatar, locale switcher, dark
    // mode toggle) — this rendered it visibly misaligned relative to the others.
    return <EchoNotificationsCenter />;
};

export default DASHHeaderActions;
