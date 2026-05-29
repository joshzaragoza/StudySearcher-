import { useEffect, useState } from "react";

function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [message, setMessage] = useState("");

  const storedUser = localStorage.getItem("loggedInUser");
  const user = storedUser ? JSON.parse(storedUser) : null;


  // Everytime the conversation ID or user ID changes, fetch the existing messages for the conversation and set up Socket.IO listeners for new messages
  useEffect(() => {
    async function fetchConversations() {
      if (!user?.id) {
        setMessage("Please log in first.");
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:3000/api/conversations/${user.id}`
        );

        const data = await res.json();

        if (res.ok) {
          setConversations(data.conversations);
        } else {
          setMessage(data.message || "Could not load messages.");
        }
      } catch {
        setMessage("Could not connect to server.");
      }
    }

    fetchConversations();
  }, [user?.id]);

  if (!user) {
    return <p>Please log in first.</p>;
  }

  return (
    <div className="messages-page">
      <h1>Messages</h1>

      {message && <p>{message}</p>}

      {conversations.length === 0 ? (
        <p>No conversations yet.</p>
      ) : (
        <ul>
          {conversations.map((conversation) => (
            <li key={conversation.conversation_id}>
              <button
                className="btn btn-primary"
                onClick={() =>
                  (window.location.href = `/chat/${conversation.conversation_id}`)
                }
              >
                Chat with {conversation.other_user_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button className="btn btn-secondary" onClick={() => (window.location.href = "/home")}>
        Back to Home
      </button>
    </div>
  );
}

export default MessagesPage;
