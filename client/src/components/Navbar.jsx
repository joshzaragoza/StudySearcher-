function NavBar() {
    return (
        <nav className="navbar">
            <h1 className="navbar-title">StudySearcher</h1>
            <div className="navbar-links">
                <a href="/home" className="navbar-link">Home</a>
                <a href="/matches" className="navbar-link">Matches</a>
                <a href="/profile" className="navbar-link">Profile</a>
            </div>
        </nav>
    );
}

export default NavBar;