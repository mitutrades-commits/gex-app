import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import AppShell from "@/components/shell/AppShell"
import { useGEXData } from "@/hooks/useGEXData"
import B3Mode from "@/views/B3Mode"
import WatchlistMode from "@/views/WatchlistMode"
import ExpiryMode from "@/views/ExpiryMode"
import Settings from "@/views/Settings"

export default function App() {
  const [b3Expiry, setB3Expiry] = useState(null)  // null = all expiries
  const gexData = useGEXData(b3Expiry)
  return (
    <BrowserRouter>
      <AppShell gexData={gexData}>
        <Routes>
          <Route path="/b3" element={<B3Mode gexData={gexData} expiry={b3Expiry} setExpiry={setB3Expiry} />} />
          <Route path="/watch" element={<WatchlistMode refreshKey={gexData.refreshKey} />} />
          <Route path="/expiry" element={<ExpiryMode refreshKey={gexData.refreshKey} />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/b3" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
