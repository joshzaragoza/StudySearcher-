import { useEffect, useState } from "react";

function MatchesPage() {
    const [matches, setMatches] = useState([]);
    const [message, setMessage] = useState("");

    const storedUser = localStorage.getItem("loggedInUser");
    const user = storedUser ? JSON.parse(storedUser) : null;

    useEffect(() => {
        async function fetchMatches() {
            if (!user?.id) {
                setMessage("Please log in first.");
                return;
            }

            try {
                const res = await fetch(`http://localhost:3000/api/matches/${user.id}`);
                const data = await res.json();

                if (res.ok) {
                    setMatches(data.matches);
                } else {
                    setMessage(data.message || "Could not load matches.");
                }
            } catch (error) {
                setMessage("Could not connect to server.");
            }
        }

        fetchMatches();
    }, []);

    async function openConversation(match) {
        // debugging logs. 
        console.log("logged in user:", user);
        console.log("match clicked:", match);

        try {
            const res = await fetch("http://localhost:3000/api/conversations/open", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    currentUserId: user.id,
                    otherUserId: match.id
                })
            });

            const data = await res.json();

            if (res.ok) {
                // Handle successful conversation creation => redirect to chat page (TO BE COMPLETED)
                window.location.href = `/chat/${data.conversationId}`;
            } else {
                setMessage(data.message || "Could not create conversation.");
            }
        } catch (error) {
            setMessage("Could not connect to server.");
        }
    }

    return (
        <div className="matches-container">
            <div className="matches-heaeder">
                <h1>Study Partner Matches</h1>
                <p>Here are your current matches based on your profile information.</p>
            </div>
            
            {message && <p className="error-msg">{message}</p>}

            {matches.length === 0 ? (
                <p className="no-matches">No matches found yet. Add classes to your profile first.</p>
            ) : (
                <ul className="matches-list">
                    {matches.map((match, index) => (
                        <li key={index} className="match-card">
                            {match.name} — Shared class: {match.shared_class}

                            <button className="btn btn--primary" onClick={() => openConversation(match)}>
                                Message
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <button className="btn btn--secondary" onClick={() => window.location.href = "/home"}>
                Back to Home
            </button>
        </div>
    );
}

export default MatchesPage;