import "../styles/Home.css";
function HomePage() {
    const loggedInUser = localStorage.getItem("loggedInUser");
    const user = loggedInUser ? JSON.parse(loggedInUser) : null;

    return (
        <div className="home-container">
            {!user ? (
                <div className="home-hero">
                    <p className="home-hero__main">StudySearcher!</p>
                    <h2>Welcome!</h2>
                    <div className="home-boxes">
                        <div className="home-box">
                            <h3 className="home-hero__main">What is StudySearcher?</h3>
                            <p>StudySearcher is a platform made by students, for students.
                                Studying with someone is proven to increase motivation and retention, yet finding a study partner can be difficult.
                                StudySearcher gets all the students who are interested in finding a study partner in one place,
                                making it easier for you to find someone to study with based on your classes and availability.
                            </p>
                        </div>
                        <div className="home-box">
                            <h3 className="home-hero__main">How does it work?</h3>
                            <p>
                                Create an account and fill out your profile with your classes and availability.
                                Then, you can browse through the list of other students and find someone who matches your criteria.
                                You can also chat with your matches to coordinate study sessions and get to know each other better.
                            </p>
                        </div>
                    </div>
                    <div  className="home-description">
                    <p>
                        Start studying and find new study partners today!
                    </p>
                    <div className="home-buttons">
                        <button
                            onClick={() => window.location.href = "/signup"}
                            className="btn btn-primary"
                        >
                            Sign Up
                        </button>
                        <button
                            onClick={() => window.location.href = "/login"}
                            className="btn btn-primary"
                        >
                            Login
                        </button>
                    </div>
                    </div>
                </div>
            ) : (
                <div className="home-hero">
                    <p className="home-hero__main">StudySearcher!</p>
                    <h2>Welcome{user?.name ? `, ${user.name}` : ""}!</h2>
                    <p>Find study partners based on your classes and availability below!</p>
                    <div className="home-buttons">
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
                </div>
            )}
        </div>
    );
}

export default HomePage;
