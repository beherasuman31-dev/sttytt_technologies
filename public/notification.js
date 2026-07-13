// =========================
// NOTIFICATIONS
// =========================

const token =
localStorage.getItem("token");

const container =
document.getElementById(
    "notificationContainer"
);

if (!token) {

    container.innerHTML =
    "<p>Please login first.</p>";

} else {

    fetch(
        "/api/notifications",
        {
            headers: {
                Authorization: token
            }
        }
    )

    .then(res => res.json())

    .then(data => {

        console.log("Notifications Data:");
        console.log(data);

        container.innerHTML = "";

        if (!data || data.length === 0) {

            container.innerHTML = `
                <div class="notification">
                    <p>No notifications found</p>
                </div>
            `;

            return;
        }

        data.forEach(n => {

            container.innerHTML += `

            <div class="notification">

                <h3>${n.title || "Notification"}</h3>

                <p>${n.message || ""}</p>

                <small>
                    ${
                        n.created_at
                        ? new Date(n.created_at).toLocaleString()
                        : ""
                    }
                </small>

            </div>

            `;
        });

        // MARK AS READ

        fetch(
            "/api/read-notifications",
            {
                method: "POST",
                headers: {
                    Authorization: token
                }
            }
        );

    })

    .catch(error => {

        console.log("Notification Error:");
        console.log(error);

        container.innerHTML = `
            <div class="notification">
                <p>Failed to load notifications</p>
            </div>
        `;
    });
}