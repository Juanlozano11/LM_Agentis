import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Home } from './pages/Home'
import { Marketplace } from './pages/Marketplace'
import { OfficeDetail } from './pages/OfficeDetail'
import { Dashboard } from './pages/Dashboard'
import { GeneralAgentDetail } from './pages/GeneralAgentDetail'
import { Workspace } from './pages/Workspace'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/office/:id" element={<OfficeDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/personal-agent/general" element={<GeneralAgentDetail />} />
        <Route path="/workspace/:agentId" element={<Workspace />} />
      </Routes>
    </BrowserRouter>
  )
}
