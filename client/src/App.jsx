import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import MatchesPage from "./pages/MatchesPage";
import ProfilePage from "./pages/ProfilePage";
import NavBar from "./components/Navbar";
import ChatPage from "./pages/ChatPage";  

function PrivateRoute({ children }) {
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (!loggedInUser) {
    return <Navigate to="/login" />;
  }
  return children;
}

function AppMain() {
  const loggedInUser = localStorage.getItem("loggedInUser");
  const isLoggedIn = !!loggedInUser;

  return (
    <>
      {isLoggedIn && <NavBar />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />

        <Route
          path="/matches"
          element={
            <PrivateRoute>
              <MatchesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/chat/:conversationId"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />

      </Routes>
    </>
  );
}

function App() {
  return (
    <>
      <BrowserRouter>
        <AppMain />
      </BrowserRouter>
    </>
  );
}

export default App; 