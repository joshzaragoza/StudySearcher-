import { useState } from 'react';

function SignupPage() {
    const [uid, setUid] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function handleSignup(e) {
        e.preventDefault();

        const res = await fetch("http://localhost:3000/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, uid, password }),
        });

        const data = await res.json();
        setMessage(data.message);
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
        </form>
    );
}

export default SignupPage;