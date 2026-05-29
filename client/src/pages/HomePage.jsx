function HomePage() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    const user = loggedInUser ? JSON.parse(loggedInUser) : null;

    return (
        <div className="home-container">
            {!user ? (
                <div className="home-hero">
                    <p className="home-hero__main">StudySearcher!</p>
                    <h2>Welcome!</h2>
                    <p>Find study partners based on your classes and availability below!</p>
                    <button
                        onClick={() => window.location.href = "/login"}
                        className="btn btn-primary"
                    >
                        Login
                    </button>
                </div>
            ) : (
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
                    <button
                        onClick={() => window.location.href = "/lost-found"}
                        className="btn btn-primary"
                    >
                        Lost & Found
                    </button>
                </div>
            )}
        </div>
    );
}

export default HomePage;
