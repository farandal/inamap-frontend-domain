import React from 'react';
import { Route } from 'react-router-dom';
import NotFound from './components/theme/components/others/NotFound';
import DASHLightWeightLogin from './components/pages/DASHLightWeightLogin';

const SharedRoutes = () => [
    
    <Route
        path="/login"
        element={
            <DASHLightWeightLogin/>
        }
    />,
    <Route
        path="*"
        element={<NotFound />}
    />

]

export default SharedRoutes;