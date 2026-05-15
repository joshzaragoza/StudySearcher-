import { useState } from "react";

function LoginPage() {
    const [uid, setUid] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    
    async function handleLogin(e) {
        e.preventDefault();

        try{
            const res = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ uid, password }),
            });
            
            const data = await res.json();
            setMessage(data.message);

            if (res.ok) {
                localStorage.setItem("loggedInUser", JSON.stringify(data.user));
                window.location.href = "/home";
            }
        } catch (error) {
            setMessage("An error occurred during login. Please try again later.");
        }
    }

      return (
    <form onSubmit={handleLogin}>
      <h1>Log In</h1>

      <input
        placeholder="UID"
        value={uid}
        onChange={(e) => setUid(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Log In</button>

      <p>{message}</p>
    </form>
     );
    }

    export default LoginPage;