import { Route } from 'react-router-dom';
import SharedRoutes from './SharedRoutes';
import DASHLightWeightLogin from './components/pages/DASHLightWeightLogin';

export const dashPrivateRoutes = () => [
    ...SharedRoutes(),
]

export const dashPublicRoutes = () => [
     ...SharedRoutes(),
     <Route
        key="landing"
        path='/'
        element={<DASHLightWeightLogin/>}
    />
   
];