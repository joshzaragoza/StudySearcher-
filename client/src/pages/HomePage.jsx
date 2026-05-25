import ProfilePage from "./ProfilePage";

function HomePage() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    return (
        <div className="home-container">
            <div className="home-hero">
                <p className="home-hero__main">StudySearcher!</p>
                <h2>Welcome{user?.name ? `, ${user.name}` : ""}!</h2>
                <p>Find study partners based on your classes and availability below!</p>
                <button 
                    onClick={() => window.location.href = "/matches"}
                    className="btn btn-primary"
                    >
                    Find Matches
                </button>
            </div>    
        </div>
    );
}

export default HomePage;