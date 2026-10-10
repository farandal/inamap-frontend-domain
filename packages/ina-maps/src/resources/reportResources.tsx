import React from 'react';
import { Route } from 'react-router-dom';
import { useTranslate } from 'react-admin';
import { createReportsResource, ReportsModule } from 'dash-reports';
import Insights from '@mui/icons-material/Insights';
import '../i18n/register';

/**
 * Módulo de reportes del framework (dash-reports) para INAMAP. Qué reportes
 * existen lo responde el registro del backend (GET /api/report): un reporte
 * que el dominio registre aparece aquí sin cambios de frontend. Se inyecta el
 * traductor de react-admin para que las claves `reports.*` se resuelvan.
 */
const InsightsIcon = Insights as unknown as React.FC;

const TranslatedReportsModule: React.FC<{ basePath: string }> = ({ basePath }) => {
    const translate = useTranslate();
    return <ReportsModule translate={translate} basePath={basePath} />;
};

const base = '/reports';

export const reportsResource = {
    ...createReportsResource({
        model: 'reports',
        label: 'resource.reports.label',
        group: 'ina_maps.groups.maps',
        icon: <InsightsIcon />,
        menuTitle: 'resource.reports.menu_list',
    }),
    customRoutes: () => (
        <>
            <Route path={base} element={<TranslatedReportsModule basePath={base} />} />
            <Route path={`${base}/:reportKey`} element={<TranslatedReportsModule basePath={base} />} />
        </>
    ),
};

export default reportsResource;
