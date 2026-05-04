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
import UserDashboardLayout from './components/UserDashboardLayout'
import UserDashboard from './pages/UserDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages tanpa layout (Full Screen) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public pages pakai layout lama */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/gosip" element={<Gosip />} />
          <Route path="/terapi" element={<Terapi />} />
        </Route>

        {/* Dashboard pakai layout sidebar baru */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Dashboard khusus User */}
        <Route element={<UserDashboardLayout />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
