import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function isTicket(body) {
    return body && body.includes("| TICKET");
}

function parseTicket(body) {
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

    const [respondedTickets, setRespondedTickets] = useState(() => {
        try {
            const stored = localStorage.getItem(`respondedTickets_${user?.id}`);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        if (!user?.id) { setMessage("Please log in first."); return; }

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
                if (res.ok) { setOtherUser(data.otherUser); fetchSharedClasses(data.otherUser.id); }
                else { setMessage(data.message || "Could not load chat user."); }
            } catch { setMessage("Could not connect to server."); }
        }

        async function fetchSharedClasses(otherUserId) {
            try {
                const res = await fetch(`http://localhost:3000/api/matches/shared/${user.id}/${otherUserId}`);
                const data = await res.json();
                if (res.ok) { setSharedClasses(data.sharedClasses); }
            } catch (error) { console.error("Could not load shared classes:", error); }
        }

        fetchOtherUser();
        fetchMessages();
        socket.emit("join_conversation", { conversationId, userId: user.id });
        socket.on("new_message", (newMessage) => {
            if (String(newMessage.conversation_id) === String(conversationId)) {
                setMessages((prev) => [...prev, newMessage]);
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

    function markResponded(msgId) {
        setRespondedTickets(prev => {
            const updated = new Set([...prev, msgId]);
            localStorage.setItem(`respondedTickets_${user?.id}`, JSON.stringify([...updated]));
            return updated;
        });
    }

    function acceptTicket(msg) {
        const ticket = parseTicket(msg.body);
        socket.emit("send_message", {
            conversationId,
            senderId: user.id,
            body: `${user.name} accepted the study invite for ${ticket.class_code}.`,
        });
        markResponded(msg.id);
    }

    function declineTicket(msg) {
        const ticket = parseTicket(msg.body);
        socket.emit("send_message", {
            conversationId,
            senderId: user.id,
            body: `${user.name} declined the study invite for ${ticket.class_code}.`,
        });
        markResponded(msg.id);
    }

    if (!user) { return <p>Please log in first.</p>; }

    const cardStyle = {
        background: "#f0f0f0",
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "14px 16px",
        margin: "8px 0",
        maxWidth: "260px",
    };

    const labelStyle = { fontSize: "11px", color: "#888", fontWeight: "600", textTransform: "uppercase", marginBottom: "2px" };
    const valueStyle = { fontSize: "15px", fontWeight: "500", marginBottom: "10px" };

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
                    const alreadyResponded = respondedTickets.has(msg.id);

                    if (isTicket(msg.body)) {
                        const ticket = parseTicket(msg.body);
                        return (
                            <div key={msg.id} style={{ ...cardStyle, alignSelf: isSent ? "flex-end" : "flex-start" }}>
                                <div style={{ fontWeight: "700", marginBottom: "12px", fontSize: "15px" }}>📋 Study Invite</div>
                                <div style={labelStyle}>Class</div>
                                <div style={valueStyle}>{ticket.class_code}</div>
                                <div style={labelStyle}>Location</div>
                                <div style={valueStyle}>{ticket.location}</div>
                                <div style={labelStyle}>When</div>
                                <div style={{ ...valueStyle, marginBottom: "4px" }}>{ticket.datetime}</div>

                                {!isSent && !alreadyResponded && (
                                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                                        <button className="btn btn--primary" onClick={() => acceptTicket(msg)}>Accept</button>
                                        <button className="btn btn--secondary" onClick={() => declineTicket(msg)}>Decline</button>
                                    </div>
                                )}
                                {!isSent && alreadyResponded && (
                                    <div style={{ fontSize: "12px", color: "#aaa", marginTop: "8px" }}>You already responded.</div>
                                )}
                                {isSent && (
                                    <div style={{ fontSize: "12px", color: "#aaa", marginTop: "8px" }}>Sent by you</div>
                                )}
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