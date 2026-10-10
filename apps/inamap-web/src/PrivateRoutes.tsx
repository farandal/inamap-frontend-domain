import React from 'react';
import { Route } from 'react-router-dom';
import Profile from './pages/Profile';

const SharedRoutes = () => [
    
    <Route
        path="/profile"
        element={
            <Profile/>
        }
    />

]

export default SharedRoutes;