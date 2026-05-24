import ProfilePage from "./ProfilePage";

function HomePage() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    return (
        <div className="home-container">
            <div className="home-topbar">
                <button 
                    className="btn btn--ghost"
                    onClick={() => {
                        window.location.href = "/profile";
                    }
                }>
                    Profile
                </button>
            </div>
            
            <div className="home-hero">
                <p className="home-hero__eyebrow">Welcome to StudySearcher!</p>
                <h2>Welcome{user?.name ? `, ${user.name}` : ""}!</h2>
                <p>Find study partners based on your classes and availability below!</p>
            </div>
            <button 
                className="btn btn--primary"
                onClick={() => window.location.href = "/matches" 
            }>
                Find Matches
            </button>
        </div>
    );
}

export default HomePage;