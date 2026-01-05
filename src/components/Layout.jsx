import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className='container'>
      <Header/>
      <Sidebar/>
      <Outlet/>
    </div>
  )
}

export default Layout
