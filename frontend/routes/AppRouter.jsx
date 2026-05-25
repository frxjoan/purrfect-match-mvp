import { BrowserRouter, Route, Routes } from 'react-router-dom'
import MainLayout from '../components/MainLayout.jsx'
import BreederDashboardPage from '../pages/BreederDashboardPage.jsx'
import HomePage from '../pages/HomePage.jsx'
import ListingDetailPage from '../pages/ListingDetailPage.jsx'
import ListingsPage from '../pages/ListingsPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import MessagesPage from '../pages/MessagesPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'

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
          <Route path="/dashboard" element={<BreederDashboardPage />} />
          <Route path="/messages" element={<MessagesPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  )
}

export default AppRouter
