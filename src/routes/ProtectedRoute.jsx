import React from 'react'
import { getCookies } from '../utils/utils';
import { LONG_LIVE_TOKEN } from '../constant/constants';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({component}) {
    const token  = getCookies(LONG_LIVE_TOKEN);

    if(!token){
        return <Navigate to={"/login"}/>
    }
    return component
}

export default ProtectedRoute