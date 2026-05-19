import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardLayout from './components/DashboardLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import UserDashboardLayout from './components/UserDashboardLayout'
import UserDashboard from './pages/UserDashboard'
import UserKuisioner from './pages/UserKuisioner'
import Responden from './pages/Responden'
import PrediksiIndividu from './pages/PrediksiIndividu'
import AnalitikRules from './pages/AnalitikRules'
import QuantumCognition from './pages/QuantumCognition'
import ModelEvaluasi from './pages/ModelEvaluasi'
import ManajemenUser from './pages/ManajemenUser'
import PengaturanSistem from './pages/PengaturanSistem'
import Laporan from './pages/Laporan'
import UserAsesmenHistory from './pages/UserAsesmenHistory'
import UserCurhat from './pages/UserCurhat'
import UserProfileSettings from './pages/userDashboard/UserProfileSettings'
import UserNetwork from './pages/userDashboard/UserNetwork'
import UserProfilePage from './pages/userDashboard/UserProfilePage'
import UserCinema from './pages/userDashboard/UserCinema'
import NotFound from './pages/NotFound'
import ForgotPassword from './pages/ForgotPassword'
import RequireRole from './components/RequireRole'
import LegacyUserRedirect from './components/LegacyUserRedirect'

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
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Public pages pakai layout lama */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/assessment" element={<LegacyUserRedirect to="/user/kuisioner" />} />
          <Route path="/gosip" element={<LegacyUserRedirect to="/user/curhat" />} />
          <Route path="/terapi" element={<LegacyUserRedirect to="/user/curhat" />} />
        </Route>

        {/* Dashboard pakai layout sidebar baru */}
        <Route element={<RequireRole allow={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/responden" element={<Responden />} />
            <Route path="/prediksi" element={<PrediksiIndividu />} />
            <Route path="/analitik" element={<AnalitikRules />} />
            <Route path="/quantum" element={<QuantumCognition />} />
            <Route path="/model" element={<ModelEvaluasi />} />
            <Route path="/users" element={<ManajemenUser />} />
            <Route path="/settings" element={<PengaturanSistem />} />
            <Route path="/laporan" element={<Laporan />} />
          </Route>
        </Route>

        {/* Dashboard khusus User */}
        <Route element={<RequireRole allow={['user']} />}>
          <Route element={<UserDashboardLayout />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/kuisioner" element={<UserKuisioner />} />
            <Route path="/user/asesmen" element={<UserAsesmenHistory />} />
            <Route path="/user/curhat" element={<UserCurhat />} />
            <Route path="/user/settings" element={<UserProfileSettings />} />
            <Route path="/user/network" element={<UserNetwork />} />
            <Route path="/user/film" element={<UserCinema />} />
            <Route path="/user/profile/:username" element={<UserProfilePage />} />
          </Route>
        </Route>

        {/* 404 — Catch All */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
