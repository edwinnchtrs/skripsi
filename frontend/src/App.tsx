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
import UserKuisioner from './pages/UserKuisioner'
import Responden from './pages/Responden'
import PrediksiIndividu from './pages/PrediksiIndividu'
import UserAsesmenHistory from './pages/UserAsesmenHistory'
import UserCurhat from './pages/UserCurhat'
import UserProfileSettings from './pages/userDashboard/UserProfileSettings'
import UserNetwork from './pages/userDashboard/UserNetwork'
function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
          <Route path="/responden" element={<Responden />} />
          <Route path="/prediksi" element={<PrediksiIndividu />} />
        </Route>

        {/* Dashboard khusus User */}
        <Route element={<UserDashboardLayout />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/kuisioner" element={<UserKuisioner />} />
          <Route path="/user/asesmen" element={<UserAsesmenHistory />} />
          <Route path="/user/curhat" element={<UserCurhat />} />
          <Route path="/user/settings" element={<UserProfileSettings />} />
          <Route path="/user/network" element={<UserNetwork />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
