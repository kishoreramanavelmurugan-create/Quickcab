const table = document.getElementById("bookingTable");
const alertBox = document.getElementById("alertBox");
const bookingAlarm = document.getElementById("bookingAlarm");
const enableSoundBtn = document.getElementById("enableSoundBtn");

let lastBookingCount = 0;
let soundEnabled = false;

function loadSoundPreference() {
    try {
        const saved = localStorage.getItem("quickcab-sound-enabled");
        return saved === "true";
    } catch (error) {
        return false;
    }
}

function saveSoundPreference(value) {
    try {
        localStorage.setItem("quickcab-sound-enabled", String(value));
    } catch (error) {
        console.log("Could not save sound preference:", error);
    }
}

function playFallbackTone() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.3);

        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
        console.log("Fallback tone failed:", error);
    }
}

function enableAlarmSound() {
    if (!bookingAlarm) return;

    bookingAlarm.volume = 0.8;
    bookingAlarm.currentTime = 0;
    bookingAlarm.play().catch(() => {
        playFallbackTone();
    });

    soundEnabled = true;
    saveSoundPreference(true);
}

soundEnabled = loadSoundPreference();

if (enableSoundBtn) {
    enableSoundBtn.addEventListener("click", enableAlarmSound);
}

document.addEventListener("click", () => {
    if (!soundEnabled) {
        enableAlarmSound();
    }
}, { once: true });

function buildCandidates(endpoint) {
    const candidates = [];

    if (window.location.origin && window.location.origin !== "null") {
        candidates.push(window.location.origin + endpoint);
    }

    candidates.push(`http://localhost:3000${endpoint}`);
    candidates.push(`http://localhost:3001${endpoint}`);
    candidates.push(`http://127.0.0.1:3000${endpoint}`);
    candidates.push(`http://127.0.0.1:3001${endpoint}`);

    return [...new Set(candidates)];
}

async function requestJson(endpoint, options = {}) {
    const candidates = buildCandidates(endpoint);

    let lastError = null;

    for (const url of candidates) {
        try {
            const response = await fetch(url, options);
            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                return data;
            }

            lastError = new Error(data.message || "Request failed");
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error("Unable to reach the server");
}

function renderBookings(bookings) {
    table.innerHTML = "";

    if (!bookings.length) {
        table.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No bookings yet.</td></tr>`;
        return;
    }

    bookings.forEach((booking) => {
        const statusClass = booking.status === "Accepted"
            ? "bg-success"
            : booking.status === "Rejected"
                ? "bg-danger"
                : "bg-warning text-dark";

        table.innerHTML += `
            <tr>
                <td>${booking.pickup}</td>
                <td>${booking.drop}</td>
                <td>${booking.vehicle}</td>
                <td><span class="badge ${statusClass}">${booking.status || "Pending"}</span></td>
                <td>
                    <button class="btn btn-sm btn-success me-2" onclick="acceptBooking('${booking._id}')">Accept</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="rejectBooking('${booking._id}')">Reject</button>
                </td>
            </tr>`;
    });
}

async function loadBookings() {
    try {
        const bookings = await requestJson("/bookings");
        renderBookings(bookings);

        if (bookings.length > lastBookingCount) {
            alertBox.classList.remove("d-none");

            if (soundEnabled) {
                if (bookingAlarm) {
                    bookingAlarm.currentTime = 0;
                    bookingAlarm.play().catch(() => {
                        playFallbackTone();
                    });
                } else {
                    playFallbackTone();
                }
            }

            setTimeout(() => {
                alertBox.classList.add("d-none");
            }, 5000);
        }

        lastBookingCount = bookings.length;
    } catch (err) {
        console.log(err);
    }
}

async function updateBookingStatus(id, status) {
    try {
        await requestJson(`/bookings/${id}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        });
        await loadBookings();
    } catch (err) {
        console.log(err);
    }
}

window.acceptBooking = function (id) {
    updateBookingStatus(id, "Accepted");
};

window.rejectBooking = function (id) {
    updateBookingStatus(id, "Rejected");
};

loadBookings();
setInterval(loadBookings, 5000);