import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import MatchesPage from "./pages/MatchesPage";
import ProfilePage from "./pages/ProfilePage";
import LostFoundPage from "./pages/LostFoundPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/profile" />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/lost-found" element={<LostFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
