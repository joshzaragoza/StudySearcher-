function profilePage() {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    return (
            <div>
            <h1>User Profile</h1>
            <p>Name: {user?.name}</p>
            <p>UID: {user?.uid}</p>


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

export default profilePage;
