import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import DashboardRedirect from '../components/DashboardRedirect.jsx'
import MainLayout from '../components/MainLayout.jsx'
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx'
import AdminReportsPage from '../pages/AdminReportsPage.jsx'
import BreederCertificationPage from '../pages/BreederCertificationPage.jsx'
import BreederDashboardPage from '../pages/BreederDashboardPage.jsx'
import BreederListingsPage from '../pages/BreederListingsPage.jsx'
import BreederMessagesPage from '../pages/BreederMessagesPage.jsx'
import BreederProfilePage from '../pages/BreederProfilePage.jsx'
import CustomerDashboardPage from '../pages/CustomerDashboardPage.jsx'
import CustomerMessagesPage from '../pages/CustomerMessagesPage.jsx'
import CustomerProfilePage from '../pages/CustomerProfilePage.jsx'
import HomePage from '../pages/HomePage.jsx'
import ListingDetailPage from '../pages/ListingDetailPage.jsx'
import ListingsPage from '../pages/ListingsPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import PendingVerificationPage from '../pages/PendingVerificationPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import UnauthorizedPage from '../pages/UnauthorizedPage.jsx'

function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route path="/listings" element={<Navigate to="/customer/listings" replace />} />
          <Route path="/listings/:listingId" element={<Navigate to="/customer/listings/:listingId" replace />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="/messages" element={<Navigate to="/customer/messages" replace />} />

          <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
          <Route path="/customer/dashboard" element={<ProtectedRoute allowedRole="customer"><CustomerDashboardPage /></ProtectedRoute>} />
          <Route path="/customer/listings" element={<ListingsPage />} />
          <Route path="/customer/listings/:listingId" element={<ListingDetailPage />} />
          <Route path="/customer/profile" element={<ProtectedRoute allowedRole="customer"><CustomerProfilePage /></ProtectedRoute>} />
          <Route path="/customer/messages" element={<ProtectedRoute allowedRole="customer"><CustomerMessagesPage /></ProtectedRoute>} />

          <Route path="/breeder" element={<Navigate to="/breeder/dashboard" replace />} />
          <Route path="/breeder/dashboard" element={<ProtectedRoute allowedRole="breeder"><BreederDashboardPage /></ProtectedRoute>} />
          <Route path="/breeder/profile" element={<ProtectedRoute allowedRole="breeder"><BreederProfilePage /></ProtectedRoute>} />
          <Route path="/breeder/certification" element={<ProtectedRoute allowedRole="breeder"><BreederCertificationPage /></ProtectedRoute>} />
          <Route path="/breeder/listings" element={<ProtectedRoute allowedRole="breeder"><BreederListingsPage /></ProtectedRoute>} />
          <Route path="/breeder/messages" element={<ProtectedRoute allowedRole="breeder"><BreederMessagesPage /></ProtectedRoute>} />

          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin/verifications" element={<ProtectedRoute allowedRole="admin"><PendingVerificationPage /></ProtectedRoute>} />
          <Route path="/admin/verifications/:breederId" element={<ProtectedRoute allowedRole="admin"><PendingVerificationPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin"><AdminReportsPage /></ProtectedRoute>} />
          <Route path="/admin/reports/:reportId" element={<ProtectedRoute allowedRole="admin"><AdminReportsPage /></ProtectedRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}

export default AppRouter
