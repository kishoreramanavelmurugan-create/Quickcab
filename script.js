const bookingForm = document.getElementById("bookingForm");
const bookingResult = document.getElementById("bookingResult");
const bookingResultTitle = document.getElementById("bookingResultTitle");
const bookingResultMessage = document.getElementById("bookingResultMessage");

function showBookingResult(type, title, message) {
    if (!bookingResult || !bookingResultTitle || !bookingResultMessage) return;

    bookingResult.classList.remove("d-none", "success", "error");
    bookingResult.classList.add(type);
    bookingResultTitle.textContent = title;
    bookingResultMessage.textContent = message;
}

if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const pickup = document.getElementById("pickup").value.trim();
        const drop = document.getElementById("drop").value.trim();
        const vehicle = document.getElementById("vehicle").value;

        if (!pickup || !drop || !vehicle) {
            showBookingResult("error", "Incomplete details", "Please fill in your pickup, drop, and vehicle type.");
            return;
        }

        const bookingData = {
            pickup,
            drop,
            vehicle
        };

        try {
            const res = await fetch("/book", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(bookingData)
            });

            const data = await res.json();

            if (res.ok) {
                showBookingResult("success", "Taxi search ready", `We found a ${vehicle} ride from ${pickup} to ${drop}.`);
                bookingForm.reset();
            } else {
                showBookingResult("error", "Booking failed", data.message || "We could not process your request right now.");
            }
        } catch (err) {
            console.error(err);
            showBookingResult("error", "Connection issue", "The server could not be reached. Please try again shortly.");
        }
    });
}
// ================= GOOGLE MAP =================

let map;
let marker;
let leafletMap;
let leafletMarker;

function initMap() {

    const defaultLocation = {
        lat: 13.0827,
        lng: 80.2707
    };

    initLeafletMap(defaultLocation);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            leafletMap.setView([lat, lng], 16);

            leafletMarker
                .setLatLng([lat, lng])
                .bindPopup("📍 Your Current Location")
                .openPopup();

        }, function(error) {
            console.log(error);
        });
    } else {
        showMapError("Geolocation is not supported by this browser.", false);
    }
}

window.onload = initMap;

function initLeafletMap(defaultLocation) {
    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    mapEl.innerHTML = "";
    mapEl.style.height = "500px";

    leafletMap = L.map("map").setView([defaultLocation.lat, defaultLocation.lng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);

    leafletMarker = L.marker([defaultLocation.lat, defaultLocation.lng]).addTo(leafletMap)
        .bindPopup("QuickCab").openPopup();
}

function showMapError(message, fallback = true) {
    const mapError = document.getElementById("mapError");
    const mapEl = document.getElementById("map");

    if (mapError) {
        mapError.textContent = message;
    }

    if (mapEl) {
        mapEl.style.border = "2px solid #dc3545";
    }

    if (fallback && !leafletMap) {
        initLeafletMap({ lat: 13.0827, lng: 80.2707 });
    }
}

