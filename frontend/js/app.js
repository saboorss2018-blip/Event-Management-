const API = "http://" + window.location.hostname + ":5000";


/* =========================
   LOAD EVENTS
========================= */

async function loadEvents() {

    const container = document.getElementById("events-container");

    if (!container) return;

    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading events...</p>
        </div>
    `;

    try {

        const response = await fetch(`${API}/api/events`);

        if (!response.ok) {
            throw new Error("Unable to load events");
        }

        const events = await response.json();

        if (events.length === 0) {

            container.innerHTML = `
                <div class="loading">
                    <h3>No events available</h3>
                    <p>Check again later for new events.</p>
                </div>
            `;

            return;
        }

        container.innerHTML = events.map(event => {

            const date = new Date(event.event_date);

            return `
                <div class="event-card">

                    <div class="event-top">
                        <div class="event-emoji">🎫</div>
                    </div>

                    <div class="event-body">

                        <h3>${event.name}</h3>

                        <div class="event-info">

                            <span>
                                📍 ${event.location}
                            </span>

                            <span>
                                📅 ${date.toLocaleString()}
                            </span>

                            <span>
                                🪑 ${event.available_seats} seats available
                            </span>

                        </div>

                        <span class="seats">
                            ${event.available_seats > 0
                                ? "● AVAILABLE"
                                : "● SOLD OUT"}
                        </span>

                        <br><br>

                        <button
                            class="btn primary-btn book-btn"
                            onclick="bookEvent(${event.id})"
                            ${event.available_seats === 0 ? "disabled" : ""}
                        >
                            🎟️ Book Ticket
                        </button>

                    </div>

                </div>
            `;

        }).join("");

    } catch (error) {

        container.innerHTML = `
            <div class="loading">

                <h3>⚠️ Unable to connect to server</h3>

                <p>
                    Make sure your Flask backend is running on port 5000.
                </p>

            </div>
        `;

        console.error(error);
    }
}


/* =========================
   REGISTER
========================= */

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const name = document.getElementById("registerName").value;
        const email = document.getElementById("registerEmail").value;
        const password = document.getElementById("registerPassword").value;

        const message = document.getElementById("registerMessage");

        try {

            const response = await fetch(`${API}/api/register`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }

            message.innerHTML = `
                <div class="success-message">
                    ✅ Registration successful! Redirecting to login...
                </div>
            `;

            registerForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {

            message.innerHTML = `
                <div class="error-message">
                    ❌ ${error.message}
                </div>
            `;

        }

    });

}


/* =========================
   LOGIN
========================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        const message = document.getElementById("loginMessage");

        try {

            const response = await fetch(`${API}/api/login`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            localStorage.setItem(
                "eventUser",
                JSON.stringify(data)
            );

            message.innerHTML = `
                <div class="success-message">
                    ✅ Login successful!
                </div>
            `;

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);

        } catch (error) {

            message.innerHTML = `
                <div class="error-message">
                    ❌ ${error.message}
                </div>
            `;

        }

    });

}


/* =========================
   BOOK EVENT
========================= */

async function bookEvent(eventId) {

    const user = localStorage.getItem("eventUser");

    if (!user) {

        alert("Please login before booking a ticket.");

        window.location.href = "login.html";

        return;
    }

    const userData = JSON.parse(user);

    const quantity = prompt(
        "How many tickets do you want to book?",
        "1"
    );

    if (!quantity) return;

    try {

        const response = await fetch(`${API}/api/bookings`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                user_id: userData.id,

                event_id: eventId,

                quantity: parseInt(quantity)

            })

        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Booking failed");
        }

        alert("🎉 Ticket booked successfully!");

        loadEvents();

    } catch (error) {

        alert("❌ " + error.message);

    }

}


/* =========================
   ADMIN CREATE EVENT
========================= */

const eventForm = document.getElementById("eventForm");

if (eventForm) {

    eventForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const name = document.getElementById("eventName").value;
        const location = document.getElementById("eventLocation").value;
        const eventDate = document.getElementById("eventDate").value;
        const seats = document.getElementById("eventSeats").value;

        const message = document.getElementById("eventMessage");

        try {

            const response = await fetch(`${API}/api/events`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    name: name,

                    location: location,

                    event_date: eventDate,

                    total_seats: parseInt(seats)

                })

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Event creation failed");
            }

            message.innerHTML = `
                <div class="success-message">
                    🎉 Event created successfully!
                </div>
            `;

            eventForm.reset();

            loadAdminEvents();

        } catch (error) {

            message.innerHTML = `
                <div class="error-message">
                    ❌ ${error.message}
                </div>
            `;

        }

    });

}


/* =========================
   ADMIN EVENTS
========================= */

async function loadAdminEvents() {

    const container = document.getElementById("admin-events");

    if (!container) return;

    try {

        const response = await fetch(`${API}/api/events`);

        const events = await response.json();

        container.innerHTML = events.map(event => {

            return `

                <div class="event-card">

                    <div class="event-top">
                        <div class="event-emoji">🎪</div>
                    </div>

                    <div class="event-body">

                        <h3>${event.name}</h3>

                        <div class="event-info">

                            <span>📍 ${event.location}</span>

                            <span>📅 ${event.event_date}</span>

                            <span>🪑 ${event.available_seats} / ${event.total_seats}</span>

                        </div>

                    </div>

                </div>

            `;

        }).join("");

    } catch (error) {

        container.innerHTML = `
            <div class="loading">
                ❌ Unable to load events.
            </div>
        `;

    }
}


/* =========================
   PAGE LOAD
========================= */

document.addEventListener("DOMContentLoaded", function() {

    loadEvents();

    loadAdminEvents();

});
