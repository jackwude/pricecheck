import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { getSettings } from './services/storage'
import HomePage from './pages/HomePage'
import AddRecordPage from './pages/AddRecordPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CategoryPage from './pages/CategoryPage'
import CalculatorPage from './pages/CalculatorPage'
import SettingsPage from './pages/SettingsPage'
import SelfTestPage from './pages/SelfTestPage'
import './App.css'

function App() {
    useEffect(() => {
        const settings = getSettings()
        document.documentElement.setAttribute('data-theme', settings.theme || 'light')
    }, [])

    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/add" element={<AddRecordPage />} />
                <Route path="/edit/:id" element={<AddRecordPage />} />
                <Route path="/product/:productName/:brand" element={<ProductDetailPage />} />
                <Route path="/categories" element={<CategoryPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/selftest" element={<SelfTestPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
