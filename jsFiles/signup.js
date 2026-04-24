function signup() {
    const name=document.getElementById("name").value.trim();
    const uid = document.getElementById("uid").value.trim();
    const password = document.getElementById("pwd").value.trim();
    const message = document.getElementById("message");
    if (name === "" || uid === "" || password === "") {
        message.textContent = "Please fill in all fields";
        return;
    }
    message.textContent = "Signing up...";
    // Later we are going to add a database to connect to sign in feature
}