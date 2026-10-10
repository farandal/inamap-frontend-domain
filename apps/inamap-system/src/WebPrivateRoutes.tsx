import { Route } from 'react-router-dom';
import DASHLightWeightLogin from './components/pages/DASHLightWeightLogin';
import SharedRoutes from './SharedRoutes';
import PrivateRoutes from './PrivateRoutes';

export const dashPrivateRoutes = () => [
    ...PrivateRoutes(),
    ...SharedRoutes(),
]

// NOTE: The "/" route was removed because there's now a dashboard resource at "/".
// Login is accessible at "/login" from shared routes.
export const dashPublicRoutes = () => [
    ...SharedRoutes(),
];
