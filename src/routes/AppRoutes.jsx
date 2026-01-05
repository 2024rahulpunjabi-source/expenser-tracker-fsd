import React from 'react'
import {Route, Routes } from 'react-router-dom'
import { Login } from '../app/auth/Login'
import Register  from '../app/auth/Register'
import {Home} from "../app/dashboard/Home"
import { ProtectedRoute } from './ProtectedRoute'

export const AppRoutes = () =>{
  return (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute component={<Home/>}/>
        } />
    </Routes>
  )
}

export default AppRoutes