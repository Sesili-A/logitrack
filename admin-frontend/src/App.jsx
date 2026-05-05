import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login         from "./pages/Login";
import Dashboard     from "./pages/Dashboard";
import Attendance    from "./pages/Attendance";
import Employees     from "./pages/Employees";
import Advances      from "./pages/Advances";
import WeeklyPayroll from "./pages/WeeklyPayroll";
import Settings      from "./pages/Settings";
import Sites         from "./pages/Sites";

function App() {
  return (
    <GoogleOAuthProvider clientId="415328633112-ld8vo7k7rbbni8b86v0i7vaio2titqim.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/employees"  element={<Employees />} />
          <Route path="/sites"      element={<Sites />} />
          <Route path="/advances"   element={<Advances />} />
          <Route path="/payroll"    element={<WeeklyPayroll />} />
          <Route path="/settings"   element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;