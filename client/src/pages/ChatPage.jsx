import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function isTicket(body) {
    return body && body.includes("| TICKET");
}

function parseTicket(body) {
    // Format: "Study Invite | CLASS | LOCATION | DATE at TIME | TICKET"
    const parts = body.split(" | ");
    return {
        class_code: parts[1] || "",
        location: parts[2] || "",
        datetime: parts[3] || "",
    };
}

function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [body, setBody] = useState("");
    const [message, setMessage] = useState("");
    const [otherUser, setOtherUser] = useState(null);
    const [sharedClasses, setSharedClasses] = useState([]);

    const storedUser = localStorage.getItem("loggedInUser");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const conversationId = window.location.pathname.split("/").pop();

    useEffect(() => {
        if (!user?.id) {
            setMessage("Please log in first.");
            return;
        }

        async function fetchMessages() {
            const res = await fetch(`http://localhost:3000/api/messages/${conversationId}`);
            const data = await res.json();
            if (res.ok) { setMessages(data.messages); }
            else { setMessage(data.message || "Could not load messages."); }
        }

        async function fetchOtherUser() {
            try {
                const res = await fetch(`http://localhost:3000/api/conversations/${conversationId}/other/${user.id}`);
                const data = await res.json();
                if (res.ok) {
                    setOtherUser(data.otherUser);
                    fetchSharedClasses(data.otherUser.id);
                } else {
                    setMessage(data.message || "Could not load chat user.");
                }
            } catch (error) {
                setMessage("Could not connect to server.");
            }
        }

        async function fetchSharedClasses(otherUserId) {
            try {
                const res = await fetch(`http://localhost:3000/api/matches/shared/${user.id}/${otherUserId}`);
                const data = await res.json();
                if (res.ok) { setSharedClasses(data.sharedClasses); }
            } catch (error) {
                console.error("Could not load shared classes:", error);
            }
        }

        fetchOtherUser();
        fetchMessages();

        socket.emit("join_conversation", { conversationId, userId: user.id });

        socket.on("new_message", (newMessage) => {
            if (String(newMessage.conversation_id) === String(conversationId)) {
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            }
        });

        return () => { socket.off("new_message"); };
    }, [conversationId, user?.id]);

    function sendMessage(e) {
        e.preventDefault();
        if (!body.trim()) { setMessage("Message cannot be empty."); return; }
        socket.emit("send_message", { conversationId, senderId: user.id, body });
        setBody("");
        setMessage("");
    }

    async function blockUser() {
        if (!otherUser?.id) { setMessage("Could not find the user to block."); return; }
        const confirmBlock = window.confirm(`Are you sure you want to block ${otherUser.name}? This will remove the chat history.`);
        if (!confirmBlock) return;
        const res = await fetch("http://localhost:3000/api/block", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blockerId: user.id, blockedId: otherUser.id }),
        });
        const data = await res.json();
        if (res.ok) { alert("User blocked."); window.location.href = "/messages"; }
        else { setMessage(data.message || "Could not block user."); }
    }

    async function acceptTicket(msg) {
        const ticket = parseTicket(msg.body);
        try {
            await fetch("http://localhost:3000/api/tickets/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    acceptor_id: user.id,
                    acceptor_name: user.name,
                    class_code: ticket.class_code,
                }),
            });
        } catch (err) {
            console.error("Could not accept ticket:", err);
        }
    }

    if (!user) { return <p>Please log in first.</p>; }

    return (
        <div className="chat-container">
            <h1>Private Chat</h1>

            {otherUser && (
                <div className="chat-header">
                    <div>
                        <h2>{otherUser.name}</h2>
                        {sharedClasses.length > 0 && (
                            <p className="chat-shared-classes">Shared classes: {sharedClasses.join(", ")}</p>
                        )}
                    </div>
                    <button type="button" className="btn btn--danger" onClick={blockUser}>Block User</button>
                </div>
            )}

            {message && <p>{message}</p>}

            <div className="messages">
                {messages.map((msg) => {
                    const isSent = Number(msg.sender_id) === Number(user.id);

                    if (isTicket(msg.body)) {
                        const ticket = parseTicket(msg.body);
                        return (
                            <div key={msg.id} style={{
                                background: "var(--surface, #f5f5f5)",
                                border: "1px solid var(--border, #ddd)",
                                borderRadius: "12px",
                                padding: "16px",
                                margin: "8px 0",
                                maxWidth: "340px",
                                alignSelf: isSent ? "flex-end" : "flex-start",
                            }}>
                                <p style={{ fontWeight: "bold", marginBottom: "8px" }}>📋 Study Invite</p>
                                <p style={{ margin: "4px 0" }}><strong>Class:</strong> {ticket.class_code}</p>
                                <p style={{ margin: "4px 0" }}><strong>Location:</strong> {ticket.location}</p>
                                <p style={{ margin: "4px 0" }}><strong>When:</strong> {ticket.datetime}</p>
                                {!isSent && (
                                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                                        <button className="btn btn--primary" onClick={() => acceptTicket(msg)}>Accept</button>
                                        <button className="btn btn--secondary" onClick={() => setMessage("Ticket declined.")}>Decline</button>
                                    </div>
                                )}
                                {isSent && <p style={{ fontSize: "12px", color: "gray", marginTop: "8px" }}>Sent by you</p>}
                            </div>
                        );
                    }

                    return (
                        <p key={msg.id} className={`message--${isSent ? "sent" : "received"}`}>
                            <strong>{isSent ? "You" : msg.sender_name || "Unknown User"}:</strong>{" "}
                            {msg.body}
                        </p>
                    );
                })}
            </div>

            <form onSubmit={sendMessage}>
                <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type a message..."
                />
                <button className="btn btn-primary" type="submit">Send</button>
            </form>

            <button className="btn btn-secondary" onClick={() => window.location.href = "/matches"}>
                Back to Matches
            </button>
        </div>
    );
}

export default ChatPage;