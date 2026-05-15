import ProfilePage from "./ProfilePage";

function HomePage() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end"}}>
                <button onClick={() => {
                    window.location.href = "/profile";}}>
                    Profile
                </button>
            </div>

            <h1>Welcome to StudySearcher!</h1>
            <h2>Welcome{user?.name ? `, ${user.name}` : ""}!</h2>
            <p>Find study partners based on your classes and availability below!</p>
        </div>
    );
}

export default HomePage;