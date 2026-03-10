import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import WorkflowStudio from './pages/WorkflowStudio'
import AgentViewer from './pages/AgentViewer'
import SkillManager from './pages/SkillManager'
import AuditLogs from './pages/AuditLogs'
import SettingsPage from './pages/Settings'
import Sidebar from './components/layout/Sidebar'

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen overflow-auto">
        <div className="p-6 max-w-screen-xl">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/studio" element={<AppLayout><WorkflowStudio /></AppLayout>} />
        <Route path="/agents" element={<AppLayout><AgentViewer /></AppLayout>} />
        <Route path="/skills" element={<AppLayout><SkillManager /></AppLayout>} />
        <Route path="/audit" element={<AppLayout><AuditLogs /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
