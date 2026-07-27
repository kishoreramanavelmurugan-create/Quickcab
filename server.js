const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const User = require("./user");
const Booking = require("./Booking");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const memoryUsers = [];
const memoryBookings = [];

function isMongoConnected() {
    return mongoose.connection.readyState === 1;
}

async function findUserByEmail(email) {
    if (isMongoConnected()) {
        return User.findOne({ email });
    }

    return memoryUsers.find((user) => user.email === email) || null;
}

async function createUser(userData) {
    if (isMongoConnected()) {
        const newUser = new User(userData);
        await newUser.save();
        return newUser;
    }

    const newUser = {
        ...userData,
        _id: `${Date.now()}-${memoryUsers.length + 1}`
    };

    memoryUsers.push(newUser);
    return newUser;
}

async function createBooking(bookingData) {
    if (isMongoConnected()) {
        const booking = new Booking(bookingData);
        await booking.save();
        return booking;
    }

    const booking = {
        ...bookingData,
        status: "Pending",
        createdAt: new Date(),
        _id: `${Date.now()}-${memoryBookings.length + 1}`
    };

    memoryBookings.push(booking);
    return booking;
}

async function getAllBookings() {
    if (isMongoConnected()) {
        return Booking.find().sort({ createdAt: -1 });
    }

    return memoryBookings.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function updateBookingStatus(id, status) {
    if (isMongoConnected()) {
        return Booking.findByIdAndUpdate(id, { status }, { new: true });
    }

    const index = memoryBookings.findIndex((booking) => String(booking._id) === String(id));
    if (index === -1) {
        return null;
    }

    memoryBookings[index] = {
        ...memoryBookings[index],
        status
    };

    return memoryBookings[index];
}

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/quickcab";

mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
})
.then(() => {
    console.log("MongoDB Connected ✅");
})
.catch((err) => {
    console.log("MongoDB Error ❌", err.message);
    console.log("Using local fallback storage for now...");
});

// Home Route
app.get("/", (req, res) => {
    res.send("QuickCab Backend Running 🚖");
});

// Register Route
app.post("/register", async (req, res) => {
    try {

        const existingUser = await findUserByEmail(req.body.email);

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const newUser = await createUser(req.body);

        res.json({
            message: "Register Success",
            user: newUser
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }
});

// Login Route
app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await findUserByEmail(email);

        if (!user || user.password !== password) {
            return res.status(401).json({
                message: "Invalid Email or Password"
            });
        }

        res.json({
            message: "Login Success",
            user
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

// Booking Route
app.post("/book", async (req, res) => {

    try {

        const { pickup, drop, vehicle } = req.body;

        if (!pickup || !drop || !vehicle) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        const booking = await createBooking({
            pickup,
            drop,
            vehicle
        });

        res.json({
            message: "Taxi Search Successful 🚕",
            booking
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

// Get All Bookings
app.get("/bookings", async (req, res) => {

    try {

        const bookings = await getAllBookings();

        res.json(bookings);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});
app.put("/bookings/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        if (!["Pending", "Accepted", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const booking = await updateBookingStatus(req.params.id, status);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.json({
            message: "Booking updated successfully",
            booking,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});
// Server
const port = Number(process.env.PORT || 3000);

const startServer = (listenPort) => {
    const server = app.listen(listenPort, () => {
        console.log(`Server running on port ${listenPort} 🚀`);
    });

    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.log(`Port ${listenPort} is busy. Trying ${listenPort + 1}...`);
            startServer(listenPort + 1);
        } else {
            throw err;
        }
    });
};

startServer(port);