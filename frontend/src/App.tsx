import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardLayout from './components/DashboardLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Assessment from './pages/Assessment'
import Gosip from './pages/Gosip'
import Terapi from './pages/Terapi'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages pakai layout lama */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/gosip" element={<Gosip />} />
          <Route path="/terapi" element={<Terapi />} />
        </Route>

        {/* Dashboard pakai layout sidebar baru */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
