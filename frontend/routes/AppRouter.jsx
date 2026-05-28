import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from '../components/MainLayout.jsx'
import BreederDashboardPage from '../pages/BreederDashboardPage.jsx'
import HomePage from '../pages/HomePage.jsx'
import ListingDetailPage from '../pages/ListingDetailPage.jsx'
import ListingsPage from '../pages/ListingsPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import MessagesPage from '../pages/MessagesPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import CustomerDashboardPage from '../pages/CustomerDashboardPage.jsx'
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import ProtectedRoute from '../src/components/ProtectedRoute.jsx'

function AppRouter() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/listings/:listingId" element={<ListingDetailPage />} />

          {/* Public messages route for now */}
          <Route path="/messages" element={<MessagesPage />} />

          {/* Protected dashboards - placeholders for role-based routing */}
          <Route
            path="/dashboard/breeder"
            element={
              <ProtectedRoute role="breeder">
                <BreederDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/customer"
            element={
              <ProtectedRoute role="customer">
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* legacy breeder route kept for compatibility */}
          <Route path="/dashboard" element={<BreederDashboardPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}

export default AppRouter
