import { useEffect, useState } from "react";


function UserProfile() {
    const [name, setName] = useState(null);
    const [classInput, setClassInput] = useState("");
    const [classes, setClasses] = useState([]);
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

        // sample pull from api
        setTimeout(() => {
            setName("Daniil");
        }, 1000);
    }, []);

    if (!name) {
        return <div>Loading...</div>;
    }

    function handleAddClass() {
        if (classInput.trim() !== "") {
            setClasses([...classes, classInput.trim()]);
            setClassInput("");
        }
    }

    return (
        <>
            <div>
                <h1>Welcome, {name}!</h1>
                <h2>Add your current classes and weekly availability so StudySearcher
                can match you with compatible study partners.
                </h2>
            </div>

            <div>
                <h3>Current Classes</h3>
                <p>Add the classes you are taking this quarter</p>
                <input
                    type="text"
                    placeholder="Enter class name"
                    value={classInput}
                    onChange={(e) => setClassInput(e.target.value)}
                />
                <button onClick={handleAddClass}>Add Class</button>
                <ul>
                    {classes.map((c, i) => (
                        <li key={i}>{c}</li>
                    ))}
                </ul>
            </div>
        </>
    );  
}
export default UserProfile; 