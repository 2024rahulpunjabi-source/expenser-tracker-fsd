import React from 'react'
import {Route, Routes } from 'react-router-dom'
import { Login } from '../app/auth/Login'
import Register  from '../app/auth/Register'

export const AppRoutes = () =>{
  return (
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
    </Routes>
  )
}

export default AppRoutes