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
                    setMatches(data.matches);
                } else {
                    setMessage(data.message || "Could not load matches.");
                }
            } catch (error) {
                setMessage("Could not connect to server.");
            }
        }

        fetchMatches();
    }, [useAvailability]);

    return (
        <div>
            <h1>Study Partner Matches</h1>

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

                <p>
                    Matching Mode:{" "}
                    {useAvailability
                        ? "Class + Availability"
                        : "Class Only"}
                </p>

            </div>

            {message && <p>{message}</p>}

            {matches.length === 0 ? (
                <p>No matches found yet. Add classes to your profile first.</p>
            ) : (
                <ul>
                    {matches.map((match, index) => (
                        <li key={index}>
                            {match.name} — Shared class: {match.shared_class}
                        </li>
                    ))}
                </ul>
            )}

            <button onClick={() => window.location.href = "/home"}>
                Back to Home
            </button>
        </div>
    );
}

export default MatchesPage;