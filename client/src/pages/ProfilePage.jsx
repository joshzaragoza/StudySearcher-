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
        monday: { start_time: "", end_time: "" },
        tuesday: { start_time: "", end_time: "" },
        wednesday: { start_time: "", end_time: "" },
        thursday: { start_time: "", end_time: "" },
        friday: { start_time: "", end_time: "" },
        saturday: { start_time: "", end_time: "" },
        sunday: { start_time: "", end_time: "" },
    });

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch(`http://localhost:3000/api/users/${user.id}/profile`);
                const data = await res.json();

                if (res.ok) {
                    setClasses(
                        data.classes.map((c) => ({
                            name: c.code,
                            professor: c.professor || "",
                        }))
                    );
                    const availMap = {};
                    data.availability.forEach(slot => {
                        const day = slot.day_of_week.toLowerCase();

                        availMap[day] = {
                            start_time: slot.start_time.slice(0, 5),
                            end_time: slot.end_time.slice(0, 5),
                        };
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
        const cleanClass = normalizeClassCode(classInput);
        const cleanProfessor = professorInput.trim();


        if (!cleanClass || !cleanProfessor) {
            setError("Please enter both a class and professor.");
            return;
        }

        if (!isValidClassCode(cleanClass)) {
            setError("Class should look like CS 35L, MATH 33A, or PIC 10A.");
            return;
        }
        
        const alreadyAdded = classes.some(
            (c) => normalizeClassCode(c.name) === cleanClass
        );

        if (alreadyAdded) {
            setError("You already added this class.");
            return;
        }

        setClasses([
            ...classes,
            { name: cleanClass, professor: cleanProfessor }

        ]);
        setClassInput("");
        setProfessorInput("");
        setError("");
    }
    function handleRemoveClass(indexToRemove) {
        setClasses(classes.filter((_, index) => index !== indexToRemove));  
    }

    function handleAvailabilityChange(day, field, value) {
        setAvailability({
            ...availability,
            [day]: {
                ...availability[day],
                [field]: value,
            },
        });
    }

    function validateProfile() {
        if (classes.length === 0) {
            setError("Add at least one class before saving.");
            return false;
        }

        const hasAvailability = Object.values(availability).some(
            (slot) => slot.start_time && slot.end_time
        );

        if (!hasAvailability) {
            setError("Add at least one availability time before saving.");
            return false;
        }

        for (const [day, slot] of Object.entries(availability)) {
            const hasStart = slot.start_time !== "";
            const hasEnd = slot.end_time !== "";

            if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
                setError(`Please complete both start and end time for ${day}.`);
                return false;
            }

            if (hasStart && hasEnd && slot.start_time >= slot.end_time) {
                setError(`Start time must be before end time for ${day}.`);
                return false;
            }
        }

        setError("");
        return true;
    }

    async function handleSaveProfile() {
        if (!validateProfile()) {
            return;
        }

        try {
            const classData = classes.map((c) => ({
                code: c.name.trim().toUpperCase(),
                professor: c.professor.trim(),
            }));

            const classRes = await fetch(`http://localhost:3000/api/users/${user.id}/classes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ classes: classData }),
            });

            const availabilityData = Object.entries(availability)
                .filter(([_, slot]) => slot.start_time && slot.end_time)
                .map(([day, slot]) => ({
                    day_of_week: day,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
            }));

            const availRes = await fetch(`http://localhost:3000/api/users/${user.id}/availability`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ availability: availabilityData }),
            });

            if (classRes.ok && availRes.ok) {
                alert("Profile saved!");
            } else {
                alert("Something went wrong saving your profile.");
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Could not connect to server.");
        }
    }

    function normalizeClassCode(input) {
        return input.trim().toUpperCase().replace(/\s+/g, " ");
    }

    function isValidClassCode(code) {
        return /^[A-Z]{2,6}\s?\d{1,4}[A-Z]{0,2}$/.test(code);
    }

    return (
            <div>
            <h1>User Profile</h1>
            <p>Name: {user?.name|| "Not available yet"} </p>
            <p>UID: {user?.uid || "Not available yet"}</p>

            {error && <p style={{ color: "red" }}>{error}</p>}

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
            
            <ul>
                {classes.map((c, i) => (
                    /* Debugging backend/frontend? bug Daniil */
                    console.log(c),
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
                        type="time"
                        value={availability[day].start_time}
                        onChange={(e) =>
                            handleAvailabilityChange(day, "start_time", e.target.value)
                        }
                    />

                    <input
                        type="time"
                        value={availability[day].end_time}
                        onChange={(e) =>
                            handleAvailabilityChange(day, "end_time", e.target.value)
                        }
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
