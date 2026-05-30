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
          const conversationsWithSharedClasses = await Promise.all(
            (data.conversations || []).map(async (conversation) => {
              try {
                const sharedRes = await fetch(
                  `http://localhost:3000/api/matches/shared/${user.id}/${conversation.other_user_id}`
                );
                const sharedData = await sharedRes.json();

                if (sharedRes.ok) {
                  return {
                    ...conversation,
                    shared_classes: sharedData.sharedClasses || [],
                  };
                }
              } catch (error) {
                console.error("Could not load shared classes:", error);
              }

              return {
                ...conversation,
                shared_classes: [],
              };
            })
          );

          setConversations(conversationsWithSharedClasses);
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

  function getSharedClasses(conversation) {
    if (Array.isArray(conversation.shared_classes)) {
      return conversation.shared_classes;
    }

    if (conversation.shared_class) {
      return [conversation.shared_class];
    }

    return [];
  }

  return (
    <div className="messages-page">
      <h1>Messages</h1>

      {message && <p>{message}</p>}

      {conversations.length === 0 ? (
        <p>No conversations yet.</p>
      ) : (
        <ul>
          {conversations.map((conversation) => {
            const sharedClasses = getSharedClasses(conversation);

            return (
              <li key={conversation.conversation_id}>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    (window.location.href = `/chat/${conversation.conversation_id}`)
                  }
                >
                  <span className="conversation-title">
                    Chat with {conversation.other_user_name}
                  </span>

                  {sharedClasses.length > 0 && (
                    <span className="conversation-shared-classes">
                      Shared classes: {sharedClasses.join(", ")}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button className="btn btn-secondary" onClick={() => (window.location.href = "/home")}>
        Back to Home
      </button>
    </div>
  );
}

export default MessagesPage;
