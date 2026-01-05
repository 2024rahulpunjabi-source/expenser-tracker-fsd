import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './App.css'
import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';

function App() {

  return (
   <>
      <AppRoutes />
      <Toaster/>
    </>

  )
}

export default App
