import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Literature from "./pages/Literature";
import Manuscript from "./pages/Manuscript";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/literature"
          element={
            <ProtectedRoute>
              <Literature />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manuscripts"
          element={
            <ProtectedRoute>
              <Manuscript />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
