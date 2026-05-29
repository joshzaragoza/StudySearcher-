import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [sharedClasses, setSharedClasses] = useState([]);

  // get conversation ID from URL and user info from local storage
  const storedUser = localStorage.getItem("loggedInUser");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const conversationId = window.location.pathname.split("/").pop();

  // Everytime the conversation ID or user ID changes, fetch the existing messages for the conversation and set up Socket.IO listeners for new messages
  useEffect(() => {
    
    if (!user?.id) {
      setMessage("Please log in first.");
      return;
    }

    // Fetch existing messages for the conversation
    async function fetchMessages() {
      const res = await fetch(`http://localhost:3000/api/messages/${conversationId}`);
      const data = await res.json();

      if (res.ok) {
        setMessages(data.messages);
      } else {
        setMessage(data.message || "Could not load messages.");
      }
    }
    
    // Fetch info for the other user in the conversation to display their name in the chat header (TO BE IMPLEMENTED)
    async function fetchOtherUser() {
      try {
        const res = await fetch(
          `http://localhost:3000/api/conversations/${conversationId}/other/${user.id}`
        );

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
        const res = await fetch(
          `http://localhost:3000/api/matches/shared/${user.id}/${otherUserId}`
        );

        const data = await res.json();

        if (res.ok) {
          setSharedClasses(data.sharedClasses);
        }
      } catch (error) {
        console.error("Could not load shared classes:", error);
      }
    }

    fetchOtherUser();
    fetchMessages();

    // Join the Socket.IO room for this conversation 
    socket.emit("join_conversation", { conversationId, userId: user.id });

    // Listen for new messages being sent in this conversation and update the message list when they arrive
    socket.on("new_message", (newMessage) => {
      if (String(newMessage.conversation_id) === String(conversationId)) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    });

    return () => {
      socket.off("new_message");
    };
  }, [conversationId, user?.id]);

  function sendMessage(e) {
    e.preventDefault();
    
    if (!body.trim()) {
      setMessage("Message cannot be empty.");
      return;
    }

    // Send the data to server. Sends conversation ID, sender ID, and message body.
    // The server will save the message to the database and then broadcast it to all users in the conversation room (including the sender, which will trigger the "new_message" listener above to update the message list in real time)
    socket.emit("send_message", {
      conversationId,
      senderId: user.id,
      body,
    });
    setBody("");
    setMessage("");
  }

  async function blockUser() {
    if (!otherUser?.id) {
      setMessage("Could not find the user to block.");
      return;
    }

    const confirmBlock = window.confirm(
      `Are you sure you want to block ${otherUser.name}? This will remove the chat history.`
    );

    if (!confirmBlock) {
      return;
    }

    const res = await fetch("http://localhost:3000/api/block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        blockerId: user.id,
        blockedId: otherUser.id,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      alert("User blocked.");
      window.location.href = "/messages"; // use /messages later once that page exists
    } else {
      setMessage(data.message || "Could not block user.");
    }
  }

  if (!user) {
    return <p>Please log in first.</p>;
  }

  return (
    <div className="chat-container">
      <h1>Private Chat</h1>

      {otherUser && (
        <div className="chat-header">
          <div>
            <h2>{otherUser.name}</h2>
            {sharedClasses.length > 0 && (
              <p className="chat-shared-classes">
                Shared classes: {sharedClasses.join(", ")}
              </p>
            )}
          </div>
          <button type="button" className="btn btn--danger" onClick={blockUser}>
            Block User
          </button>
        </div>
      )}

      {message && <p>{message}</p>}

      <div className="messages">
        {messages.map((msg) => (
          <p key={msg.id}>
           <strong>
              {Number(msg.sender_id) === Number(user.id)
                ? "You"
                : msg.sender_name || "Unknown User"}
              :
            </strong>{" "}
            {msg.body}
          </p>
        ))}
      </div>

      <form onSubmit={sendMessage}>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
        />
        <button className="btn btn-primary" type="submit">
          Send
        </button>
      </form>

      <button className="btn btn-secondary" onClick={() => window.location.href = "/matches"}>
        Back to Matches
      </button>
    </div>
  );
}

export default ChatPage;
