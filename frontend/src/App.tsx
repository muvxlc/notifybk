import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ConfigEditor from "./pages/ConfigEditor";
import Layout from "./components/Layout";
import Connections from "./pages/Connections";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/configs/:id?" element={<ConfigEditor />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
