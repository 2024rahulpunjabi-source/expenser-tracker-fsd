import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { Login } from '../app/auth/login'
import Register from '../app/auth/Register'
import { Home } from '../app/dashboard/Home'
import ProtectedRoute from './ProtectedRoute'
import Layout from '../components/Layout'
import Transactions from '../app/transactions/Transactions'

function AppRoutes() {
  return (
    <Routes>
        <Route path='/login' element={<Login/>}></Route>
        <Route path='/register' element={<Register/>}></Route>
        <Route element={<Layout/>}>
          <Route path='/' element={<ProtectedRoute component={<Home/>}/>}/>  
          <Route path='/transactions' element={<ProtectedRoute component={<Transactions/>}/>}/> 
        </Route>
    </Routes>
  )
}

export default AppRoutes
