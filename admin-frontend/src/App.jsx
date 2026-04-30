import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login         from "./pages/Login";
import Dashboard     from "./pages/Dashboard";
import Attendance    from "./pages/Attendance";
import Employees     from "./pages/Employees";
import Advances      from "./pages/Advances";
import WeeklyPayroll from "./pages/WeeklyPayroll";
import Settings      from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/employees"  element={<Employees />} />
        <Route path="/advances"   element={<Advances />} />
        <Route path="/payroll"    element={<WeeklyPayroll />} />
        <Route path="/settings"   element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;