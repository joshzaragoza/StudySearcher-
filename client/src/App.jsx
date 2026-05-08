import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import UserProfile from "./pages/UserProfile";

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/signup">Sign Up</Link>
        {" | "}
        <Link to="/login">Log In</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 