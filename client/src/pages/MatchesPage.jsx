import { useEffect, useState } from "react";

function MatchesPage() {
    const [matches, setMatches] = useState([]);
    const [message, setMessage] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [tickets, setTickets] = useState([]);

    const [classInput, setClassInput] = useState("");
    const [locationInput, setLocationInput] = useState("");
    const [dateInput, setDateInput] = useState("");
    const [timeInput, setTimeInput] = useState("");
    const [maxPeople, setMaxPeople] = useState("");
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
        const filtered = matches
            .filter(m => m.shared_class === classInput)
            .map(m => m.id);
        setSelectedRecipients(filtered);
    }

    function handlePostTicket() {
        if (!classInput || !locationInput || !dateInput || !timeInput || !maxPeople) {
            setMessage("Please fill in all fields.");
            return;
        }

        if (selectedRecipients.length === 0) {
            setMessage("Please select at least one recipient.");
            return;
        }

        const newTicket = {
            id: Date.now(),
            creator: user.name,
            creatorId: user.id,
            class_code: classInput,
            location: locationInput,
            date: dateInput,
            time: timeInput,
            max_people: parseInt(maxPeople),
            acceptances: 0,
            recipients: selectedRecipients
        };

        setTickets([...tickets, newTicket]);
        setShowForm(false);
        setClassInput("");
        setLocationInput("");
        setDateInput("");
        setTimeInput("");
        setMaxPeople("");
        setSelectedRecipients([]);
        setMessage("");
    }

    function handleAccept(ticketId) {
        setTickets(tickets.map(t =>
            t.id === ticketId
                ? { ...t, acceptances: t.acceptances + 1 }
                : t
        ).filter(t => t.acceptances < t.max_people || t.id !== ticketId));
    }

    const visibleTickets = tickets.filter(t =>
        t.creatorId === user?.id || t.recipients.includes(user?.id)
    );

    return (
        <div className="matches-container">
            <h1>Study Partner Matches</h1>
            <p>Here are your current matches based on your profile information.</p>

            {message && <p className="error-msg">{message}</p>}

            {!showForm && (
                <button className="btn btn--primary" onClick={() => setShowForm(true)}>
                    + Create Study Ticket
                </button>
            )}

            {showForm && (
                <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                    <h2>Create Study Ticket</h2>

                    <input
                        type="text"
                        placeholder="Class (e.g. CS35L)"
                        value={classInput}
                        onChange={(e) => setClassInput(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Location (e.g. Powell Library)"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Date (e.g. May 28)"
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Time (e.g. 3:00 PM)"
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Max people (e.g. 3)"
                        value={maxPeople}
                        onChange={(e) => setMaxPeople(e.target.value)}
                    />

                    <p>Send to:</p>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {matches.map((match, i) => (
                            <li key={i}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selectedRecipients.includes(match.id)}
                                        onChange={() => toggleRecipient(match.id)}
                                    />
                                    {" "}{match.name} — {match.shared_class}
                                </label>
                            </li>
                        ))}
                    </ul>

                    <button className="btn btn--secondary" onClick={selectAll}>
                        Select all matched in {classInput || "this class"}
                    </button>

                    <br /><br />

                    <button className="btn btn--primary" onClick={handlePostTicket}>
                        Post Ticket
                    </button>
                    {" "}
                    <button className="btn btn--secondary" onClick={() => { setShowForm(false); setMessage(""); }}>
                        Cancel
                    </button>
                </div>
            )}

            {visibleTickets.length > 0 && (
                <>
                    <h2>Open Study Tickets</h2>
                    <ul className="matches-list">
                        {visibleTickets.map((ticket, i) => (
                            <li key={i} className="match-card" style={{ flexDirection: "column", alignItems: "flex-start", gap: "8px" }}>
                                <strong>{ticket.class_code} — {ticket.location}</strong>
                                <span>{ticket.date} at {ticket.time} · Posted by {ticket.creator} · {ticket.acceptances}/{ticket.max_people} spots filled</span>
                                <div>
                                    {ticket.creatorId !== user?.id && (
                                        <button className="btn btn--primary" onClick={() => handleAccept(ticket.id)}>
                                            Accept
                                        </button>
                                    )}
                                    {" "}
                                    <button
                                        className="btn btn--secondary"
                                        onClick={() => openConversation({ id: ticket.creatorId })}
                                    >
                                        Message
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <h2>Your Matches</h2>

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