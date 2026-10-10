import React from 'react';
import { Route } from 'react-router-dom';
import { Profile } from 'dash-admin';

const SharedRoutes = () => [
    
    <Route
        path="/profile"
        element={
            <Profile/>
        }
    />

]

export default SharedRoutes;