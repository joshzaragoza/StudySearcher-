import { useEffect, useState } from "react";

function MatchesPage() {
    const [matches, setMatches] = useState([]);
    const [message, setMessage] = useState("");
    const [useAvailability, setUseAvailability] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [sending, setSending] = useState(false);

    const [classInput, setClassInput] = useState("");
    const [locationInput, setLocationInput] = useState("");
    const [dateInput, setDateInput] = useState("");
    const [timeInput, setTimeInput] = useState("");
    const [selectedRecipients, setSelectedRecipients] = useState([]);

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
                    const matchesWithSharedClasses = await Promise.all(
                        data.matches.map(async (match) => {
                            try {
                                const sharedRes = await fetch(
                                    `http://localhost:3000/api/matches/shared/${user.id}/${match.id}`
                                );
                                const sharedData = await sharedRes.json();
                                if (sharedRes.ok) {
                                    return { ...match, shared_classes: sharedData.sharedClasses };
                                }
                            } catch (error) {
                                console.error("Could not load shared classes:", error);
                            }
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
        try {
            const res = await fetch("http://localhost:3000/api/conversations/open", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentUserId: user.id,
                    otherUserId: match.id
                })
            });

            const data = await res.json();

            if (res.ok) {
                window.location.href = `/chat/${data.conversationId}`;
            } else {
                setMessage(data.message || "Could not create conversation.");
            }
        } catch (error) {
            setMessage("Could not connect to server.");
        }
    }

    function toggleRecipient(matchId) {
        setSelectedRecipients(prev =>
            prev.includes(matchId)
                ? prev.filter(id => id !== matchId)
                : [...prev, matchId]
        );
    }

    function selectAll() {
        setSelectedRecipients(matches.map(m => m.id));
    }

    async function handlePostTicket() {
        if (!classInput || !locationInput || !dateInput || !timeInput) {
            setMessage("Please fill in all fields.");
            return;
        }

        if (selectedRecipients.length === 0) {
            setMessage("Please select at least one recipient.");
            return;
        }

        setSending(true);
        setMessage("");

        try {
            for (const recipientId of selectedRecipients) {
                // Open or find existing DM
                const convoRes = await fetch("http://localhost:3000/api/conversations/open", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        currentUserId: user.id,
                        otherUserId: recipientId
                    })
                });

                const convoData = await convoRes.json();
                if (!convoRes.ok) continue;

                // Send ticket message
                await fetch("http://localhost:3000/api/tickets/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversation_id: convoData.conversationId,
                        sender_id: user.id,
                        class_code: classInput,
                        location: locationInput,
                        study_date: dateInput,
                        study_time: timeInput,
                    })
                });
            }

            setShowForm(false);
            setClassInput("");
            setLocationInput("");
            setDateInput("");
            setTimeInput("");
            setSelectedRecipients([]);
            setMessage("Study ticket sent!");
        } catch (error) {
            setMessage("Could not send ticket. Please try again.");
        } finally {
            setSending(false);
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
                <p>Matching Mode: {useAvailability ? "Class + Availability" : "Class Only"}</p>
            </div>

            {message && <p>{message}</p>}

            {!showForm && (
                <button className="btn btn--primary" onClick={() => { setShowForm(true); setMessage(""); }}>
                    + Create Study Ticket
                </button>
            )}

            {showForm && (
                <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", marginBottom: "16px", textAlign: "left" }}>
                    <h2>Create Study Ticket</h2>

                    <input
                        type="text"
                        placeholder="Class (e.g. CS35L)"
                        value={classInput}
                        onChange={(e) => setClassInput(e.target.value)}
                        style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", boxSizing: "border-box" }}
                    />
                    <input
                        type="text"
                        placeholder="Location (e.g. Powell Library)"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", boxSizing: "border-box" }}
                    />
                    <input
                        type="text"
                        placeholder="Date (e.g. May 28)"
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", boxSizing: "border-box" }}
                    />
                    <input
                        type="text"
                        placeholder="Time (e.g. 3:00 PM)"
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
                        style={{ display: "block", width: "100%", marginBottom: "10px", padding: "8px", boxSizing: "border-box" }}
                    />

                    <p style={{ marginBottom: "8px" }}>Send to:</p>
                    <ul style={{ listStyle: "none", padding: 0, marginBottom: "10px" }}>
                        {matches.map((match, i) => (
                            <li key={i} style={{ marginBottom: "6px" }}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selectedRecipients.includes(match.id)}
                                        onChange={() => toggleRecipient(match.id)}
                                    />
                                    {" "}{match.name} — {match.shared_classes?.join(", ") || match.shared_class}
                                </label>
                            </li>
                        ))}
                    </ul>

                    <button className="btn btn--secondary" onClick={selectAll} style={{ marginBottom: "12px" }}>
                        Select All
                    </button>

                    <br />

                    <button className="btn btn--primary" onClick={handlePostTicket} disabled={sending}>
                        {sending ? "Sending..." : "Send Ticket"}
                    </button>
                    {" "}
                    <button className="btn btn--secondary" onClick={() => { setShowForm(false); setMessage(""); }}>
                        Cancel
                    </button>
                </div>
            )}

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