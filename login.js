const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please fill all fields.");
        return;
    }

    const loginData = {
        email,
        password
    };

    try {

        const response = await fetch("/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(loginData)

        });

        const data = await response.json();
        if (response.ok) {

            alert("Login Successful ✅");

            localStorage.setItem("user", JSON.stringify(data));

            window.location.href = "/driver";

        } else {

            alert(data.message || "Invalid Email or Password ❌");

        }

    } catch (error) {

        console.error("Login Error:", error);

        alert("Server connection failed. Please try again later.");

    }

});