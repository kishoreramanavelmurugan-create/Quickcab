const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!name || !email || !phone || !password || !confirmPassword) {
            alert("Please fill all fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Registration Successful ✅");
                window.location.href = "/login";
            } else {
                alert(data.message || "Registration failed.");
            }
        } catch (error) {
            console.error("Register Error:", error);
            alert("Server connection failed. Please try again later.");
        }
    });
}
