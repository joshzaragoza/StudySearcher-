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

    return (
        <div>
            <h1>Welcome, {name}!</h1>
            <h2>Add your current classes and weekly availability so StudySearcher
              can match you with compatible study partners.
            </h2>
        </div>

    );  
}
export default UserProfile; 