import { useState, useEffect } from "react";

function ProfilePage() {
    const storedUser = localStorage.getItem("loggedInUser");
    if (!storedUser) {
        return <p>Please log in first.</p>
    }
    
    let user = null;
    try {
        user = JSON.parse(storedUser);
    } catch {
    user = { uid: storedUser, name: null };
    }
    const [classInput, setClassInput] = useState("");
    const [professorInput, setProfessorInput] = useState("");
    const [classes, setClasses] = useState([]);
    const [error, setError] = useState("");
    const [availability, setAvailability] = useState({
        monday: "",
        tuesday: "",
        wednesday: "",
        thursday: "",
        friday: "",
        saturday: "",
        sunday: "",
    });

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch(`http://localhost:3000/api/users/${user.id}/profile`);
                const data = await res.json();

                if (res.ok) {
                    setClasses(data.classes.map(code => ({ name: code, professor: "" })));
                    const availMap = {};
                    data.availability.forEach(slot => {
                        availMap[slot.day_of_week.toLowerCase()] = `${slot.start_time} - ${slot.end_time}`;
                    });
                    setAvailability(prev => ({ ...prev, ...availMap }));
                }
            } catch (error) {
                console.error("Error loading profile:", error);
            }
        }

        fetchProfile();
    }, []);

    function handleAddClass() {
        if (classInput.trim() === "" || professorInput.trim() === "") {
            setError("Please fill in all fields.");
            return;

        }
        setClasses([
            ...classes,
            { name: classInput.trim(), professor: professorInput.trim() }

        ]);
        setClassInput("");
        setProfessorInput("");
        setError("");
    }
    function handleRemoveClass(indexToRemove) {
        setClasses(classes.filter((_, index) => index !== indexToRemove));  
    }

    function handleAvailabilityChange(day, value) {
        setAvailability({
            ...availability,
            [day]: value
        });
    }
    function handleSaveProfile() {
        const profileData = {
            user,
            classes,
            availability
        };
        localStorage.setItem("profileData", JSON.stringify(profileData));
        alert("Profile saved!");
        }

    return (
            <div>
            <h1>User Profile</h1>
            <p>Name: {user?.name|| "Not available yet"} </p>
            <p>UID: {user?.uid || "Not available yet"}</p>

            <h2>Current Classes</h2>
            <input
                type="text"
                placeholder="Enter class name"
                value={classInput}
                onChange={(e) => setClassInput(e.target.value)}
                />
            <input 
                type="text"
                placeholder="Enter professor name"
                value={professorInput}
                onChange={(e) => setProfessorInput(e.target.value)}
                />
            <button onClick={handleAddClass}>Add Class</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <ul>
                {classes.map((c, i) => (
                    <li key={i}>{c.name} - {c.professor}
                    <button onClick={() => handleRemoveClass(i)}>
                        Remove
                    </button>
                    </li>
                ))}
            </ul>

            <h2>Weekly Availability</h2>
            {Object.keys(availability).map((day) => (
                <div key={day}>
                <label>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
                <input 
                type ="text"
                placeholder="Example: 3PM - 5PM" 
                value={availability[day]}
                onChange={(e) => handleAvailabilityChange(day, e.target.value)}
                />
                </div>
             ))}

            <button onClick={handleSaveProfile}>Save Profile</button>

            <br /><br />


            <button
                onClick={() => {
                window.location.href = "/home";}}>
                Back to Home
            </button>

            <button onClick={() => {
                localStorage.removeItem("loggedInUser");
                window.location.href = "/login";}}>
                Log Out
            </button>

        </div>
    );
}

export default ProfilePage;
