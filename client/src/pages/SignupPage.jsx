import { useState } from 'react';

function SignupPage() {
    const [uid, setUid] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

async function handleSignup(e) {
    e.preventDefault();
    setMessage("");

    const cleanUid = uid.trim();
    const cleanName = name.trim();

    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!cleanName || !cleanUid || !password) {
        setMessage("Please fill in all fields.");
        return;
    }

    if (!/^\d{9}$/.test(cleanUid)) {
        setMessage("UID must be exactly 9 digits.");
        return;
    }

    if (!passwordRegex.test(password)) {
        setMessage(
            "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
        );
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/api/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: cleanName,
                uid: cleanUid,
                password,
            }),
        });

        const data = await res.json();
        setMessage(data.message || "Signup finished.");

    } catch (error) {
        setMessage("Could not connect to server.");
    }
}

    return (
        <form onSubmit={handleSignup}>
            <h1>Sign Up</h1>

            <input
                placeholder="UID"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
            />

            <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Sign Up</button>

            <p>{message}</p>

            
      <p>
        Already have an account? {""}
        <span  style={{ color: "blue", textDecoration: "underline", cursor: "pointer" }} onClick={() => {window.location.href = "/login"}}>
            Log In
        </span>
      </p>
      
        </form>
    );
}

export default SignupPage;