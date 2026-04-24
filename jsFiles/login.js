const users = [ {uid: "000000001", password: "pass123", name: "robby"} ];

function login() {
    const uid = document.getElementById("uid").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    if (uid === "" || password === "") {
        message.textContent = "Please fill in all fields.";
        return;
    }
    
    const foundUser = users.find(user => user.uid === uid && user.password === password);

    if (foundUser) {
        message.textContent = `Welcome, ${foundUser.name}!`;

        localStorage.setItem("loggedInUser", foundUser.uid);

    // Later we can redirect pages here
    // window.location.href = "dashboard.html";

    } else {
        message.textContent = "Invalid UID or password.";
    }

}