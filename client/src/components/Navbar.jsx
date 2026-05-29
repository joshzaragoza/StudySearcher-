function NavBar() {
    return (
        <nav className="navbar">
            <h1 className="navbar-title">StudySearcher</h1>
            <div className="navbar-links">
                <a href="/home" className="navbar-link">Home</a>
                <a href="/matches" className="navbar-link">Matches</a>
                <a href="/messages" className="navbar-link">Messages</a>
                <a href="/profile" className="navbar-link">Profile</a>
                <button
                    className="btn btn--danger"
                    onClick={() => {
                        localStorage.removeItem("loggedInUser");
                        window.location.href = "/login";
                    }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default NavBar;
