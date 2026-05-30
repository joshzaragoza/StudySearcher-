import { useEffect, useState } from "react";

function MatchesPage() {
    const [matches, setMatches] = useState([]);
    const [message, setMessage] = useState("");
    const [useAvailability, setUseAvailability] = useState(false);


    const storedUser = localStorage.getItem("loggedInUser");
    const user = storedUser ? JSON.parse(storedUser) : null;

    useEffect(() => {
        async function fetchMatches() {
            if (!user?.id) {
                setMessage("Please log in first.");
                return;
            }

            try {
                const res = await fetch(`http://localhost:3000/api/matches/${user.id}?availability=${useAvailability}`);
                const data = await res.json();

                if (res.ok) {
                    // For each match, also fetch the shared classes to display in the UI
                    const matchesWithSharedClasses = await Promise.all(
                        data.matches.map(async (match) => {
                            try {
                                const sharedRes = await fetch(
                                    `http://localhost:3000/api/matches/shared/${user.id}/${match.id}`
                                );
                                const sharedData = await sharedRes.json();
                                
                                // If the shared classes fetch is successful, add the shared_classes array to the match object
                                if (sharedRes.ok) {
                                    return {
                                        ...match,
                                        shared_classes: sharedData.sharedClasses,
                                    };
                                }
                            } catch (error) {
                                console.error("Could not load shared classes:", error);
                            }
                            
                            // If there was an error fetching shared classes, return the match object without the shared_classes field (or with it as an empty array)
                            return {
                                ...match,
                                shared_classes: match.shared_class ? [match.shared_class] : [],
                            };
                        })
                    );

                    setMatches(matchesWithSharedClasses);
                } else {
                    setMessage(data.message || "Could not load matches.");
                }
            } catch (error) {
                setMessage("Could not connect to server.");
            }
        }

        fetchMatches();
    }, [useAvailability]);

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
            <div className="matches-header">
                <h1>Study Matches</h1>
            <div style={{ marginBottom: "20px" }}>
                <button
                    onClick={() => setUseAvailability(false)}
                    disabled={!useAvailability}
                >
                    Class Only
                </button>

                <button
                    onClick={() => setUseAvailability(true)}
                    disabled={useAvailability}
                    style={{ marginLeft: "10px" }}
                >
                    Class + Time
                </button>
            </div>

                <p>
                    Matching Mode:{" "}
                    {useAvailability
                        ? "Class + Availability"
                        : "Class Only"}
                </p>

            </div>

            {message && <p>{message}</p>}

            {matches.length === 0 ? (
                <p className="no-matches">No matches found yet. Add classes to your profile first.</p>
            ) : (
                <ul className="matches-list">
                    {matches.map((match, index) => (
                        <li key={index} className="match-card">
                            {match.name} — Shared classes:{" "}
                            {match.shared_classes?.length > 0
                                ? match.shared_classes.join(", ")
                                : match.shared_class || "None listed"}

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
