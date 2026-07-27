const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    pickup: {
        type: String,
        required: true
    },
    drop: {
        type: String,
        required: true
    },
    vehicle: {
        type: String,
        required: true
    },
    status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending"
},
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Booking", bookingSchema);