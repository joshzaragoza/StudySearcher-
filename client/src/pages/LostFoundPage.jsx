import { useState, useEffect } from "react";

function LostFoundPage() {
    const storedUser = localStorage.getItem("loggedInUser");
    const user = storedUser ? JSON.parse(storedUser) : null;

    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchPosts();
    }, []);

    async function fetchPosts() {
        try {
            const res = await fetch("http://localhost:3000/api/lost-found");
            const data = await res.json();
            if (res.ok) {
                setPosts(data.posts);
            } else {
                setMessage("Could not load posts.");
            }
        } catch (error) {
            setMessage("Could not connect to server.");
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (content.trim() === "") {
            setMessage("Post cannot be empty.");
            return;
        }

        if (content.length > 5000) {
            setMessage("Post cannot exceed 5000 characters.");
            return;
        }

        try {
            const res = await fetch("http://localhost:3000/api/lost-found", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id, content }),
            });

            const data = await res.json();

            if (res.ok) {
                setContent("");
                setMessage("");
                fetchPosts();
            } else {
                setMessage(data.message || "Could not submit post.");
            }
        } catch (error) {
            setMessage("Could not connect to server.");
        }
    }

    return (
        <div>
            <h1>Lost & Found</h1>

            <form onSubmit={handleSubmit}>
                <textarea
                    placeholder="Describe your lost item and where you last saw it..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={5000}
                    rows={5}
                    style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
                />
                <p>{content.length} / 5000</p>
                {message && <p style={{ color: "red" }}>{message}</p>}
                <button type="submit">Post</button>
            </form>

            <hr />

            {posts.length === 0 ? (
                <p>No lost item posts yet.</p>
            ) : (
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {posts.map((post) => (
                        <li key={post.id} style={{ marginBottom: "24px", textAlign: "left" }}>
                            <strong>{post.poster_name}</strong>
                            <span style={{ marginLeft: "12px", fontSize: "0.85em", color: "var(--text)" }}>
                                {new Date(post.created_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}
                            </span>
                            <p style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>{post.content}</p>
                        </li>
                    ))}
                </ul>
            )}

            <button onClick={() => window.location.href = "/home"}>Back to Home</button>
        </div>
    );
}

export default LostFoundPage;
