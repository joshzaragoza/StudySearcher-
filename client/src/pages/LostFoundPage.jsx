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

    async function openConversation(posterId) {
        try {
            const res = await fetch("http://localhost:3000/api/conversations/open", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentUserId: user.id, otherUserId: posterId })
            });
            const data = await res.json();
            if (res.ok) { window.location.href = `/chat/${data.conversationId}`; }
            else { setMessage(data.message || "Could not open conversation."); }
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
        <div className="lost-found-container">
            <h1>Lost & Found</h1>

            <form className="lost-found-form" onSubmit={handleSubmit}>
                <textarea
                    placeholder="Describe your lost item and where you last saw it..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={5000}
                    rows={5}
                />
                <p className="character-count">{content.length} / 5000</p>
                {message && <p className="error-msg">{message}</p>}
                <button className="btn btn--primary" type="submit">Post</button>
            </form>

            <hr />

            {posts.length === 0 ? (
                <p className="empty-state">No lost item posts yet.</p>
            ) : (
                <ul className="lost-found-list">
                    {posts.map((post) => (
                        <li key={post.id} className="lost-found-post" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ flex: 1 }}>
                                <strong>{post.poster_name}</strong>
                                <span className="post-time">
                                    {new Date(post.created_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}
                                </span>
                                <p>{post.content}</p>
                            </div>
                            <div style={{ flexShrink: 0, marginLeft: "16px" }}>
                                {Number(post.poster_id) !== Number(user?.id) && (
                                    <button className="btn btn--primary" onClick={() => openConversation(post.poster_id)}>Message</button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <button className="btn btn--secondary" onClick={() => window.location.href = "/home"}>Back to Home</button>
        </div>
    );
}

export default LostFoundPage;
