const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const modal = document.getElementById("eventModal");
const detailBox = document.getElementById("eventDetail");
const detailContent = document.getElementById("detailContent");

const YEAR = 2026;
let currentMonth = 0;
let events = JSON.parse(localStorage.getItem("events2026")) || [];
let selectedEventIndex = null;
// =========================
// SIDEBAR TOGGLE LOGIC
// =========================
const sidebar = document.querySelector(".sidebar");
const menuBtn = document.getElementById("menuBtn");

menuBtn.onclick = () => {
    sidebar.classList.toggle("open");
};
document.addEventListener("click", (e) => {
    if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)
    ) {
        sidebar.classList.remove("open");
    }
});

function renderCalendar() {
    calendar.innerHTML = "";
    const date = new Date(YEAR, currentMonth, 1);
    monthYear.textContent =
        date.toLocaleString("default", { month: "long" }) + " 2026";

    const firstDay = date.getDay();
    const totalDays = new Date(YEAR, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendar.appendChild(document.createElement("div"));
    }

    for (let d = 1; d <= totalDays; d++) {
        const cell = document.createElement("div");
        cell.className = "day";
        cell.innerHTML = `<span>${d}</span>`;

        const key = `${YEAR}-${String(currentMonth + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

        // ✅ GUARANTEED HIGHLIGHT
        const ev = events.find(e => e.days.includes(key));
        if (ev) {
            cell.classList.add(ev.priority);
        }
        const dayEvents = events.filter(e => e.days.includes(key));
        if (dayEvents.length > 0) {
            const list = document.createElement("div");
            list.className = "event-list";

            dayEvents.forEach(e => {
                const title = document.createElement("div");
                title.className = "event-title";
                title.textContent = e.title;
                list.appendChild(title);
            });

            cell.appendChild(list);
        }


        cell.onclick = () => showEvent(key);
        calendar.appendChild(cell);
    }
}


function getEventForDay(dayKey) {
    return events.find(ev => ev.days.includes(dayKey));
}

function showEvent(dayKey) {
    const index = events.findIndex(ev => ev.days.includes(dayKey));
    if (index === -1) return;

    selectedEventIndex = index;
    const ev = events[index];

    detailBox.className = `event-detail ${ev.priority}`;
    detailContent.innerHTML = `
        <h3>${ev.title}</h3>
        <p><strong>Date:</strong> ${ev.startDate} → ${ev.endDate}</p>
        <p><strong>Team:</strong> ${ev.team || "-"}</p>
        ${ev.meetingLink ? `<p><a href="${ev.meetingLink}" target="_blank">Join Meeting</a></p>` : ""}
        <p><strong>Agenda:</strong><br>${ev.agenda || "-"}</p>
    `;
    detailBox.style.display = "block";
}

document.getElementById("closeDetail").onclick = () =>
    detailBox.style.display = "none";

document.getElementById("addEventBtn").onclick = () => {
    sidebar.classList.remove("open");     // close sidebar
    document.body.classList.add("modal-open"); // 🔥 IMPORTANT
    modal.style.display = "flex";
};


document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open"); // 🔥 IMPORTANT
};


document.getElementById("saveEvent").onclick = () => {
    //const start = new Date(startDate.value);
    const start = new Date(startDate.value + "T00:00:00");

    const recurrence = document.getElementById("recurrence").value;

    let end;
if (recurrence === "none") {
    const endInput = endDate.value || startDate.value;
    end = new Date(
        endInput + "T23:59:59"
    );
} else {
    end = new Date(YEAR, 11, 31, 23, 59, 59);
}

    const days = [];
    let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());


    while (cursor <= end) {
    days.push(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`
    );

    if (recurrence === "none") {
        cursor.setDate(cursor.getDate() + 1);
    }
    else if (recurrence === "daily") {
        cursor.setDate(cursor.getDate() + 1);
    }
    else if (recurrence === "weekly") {
        cursor.setDate(cursor.getDate() + 7);
    }
    else if (recurrence === "monthly") {
        const originalDay = cursor.getDate();

        cursor.setMonth(cursor.getMonth() + 1, 1);

        const lastDayOfMonth = new Date(
            cursor.getFullYear(),
            cursor.getMonth() + 1,
            0
        ).getDate();

        cursor.setDate(Math.min(originalDay, lastDayOfMonth));
    }
}




    events.push({
        title: title.value,
        startDate: startDate.value,
        endDate: endDate.value || startDate.value,
        priority: priority.value,
        team: team.value,
        meetingLink: meetingLink.value,
        agenda: agenda.value,
        recurrence,
        days
    });

    localStorage.setItem("events2026", JSON.stringify(events));
    modal.style.display = "none";
    renderCalendar();
};

document.getElementById("editEvent").onclick = () => {
    const ev = events[selectedEventIndex];
    title.value = ev.title;
    startDate.value = ev.startDate;
    endDate.value = ev.endDate;
    priority.value = ev.priority;
    team.value = ev.team;
    meetingLink.value = ev.meetingLink;
    agenda.value = ev.agenda;
    modal.style.display = "block";
};

document.getElementById("deleteEvent").onclick = () => {
    if (selectedEventIndex !== null) {
        events.splice(selectedEventIndex, 1);
        localStorage.setItem("events2026", JSON.stringify(events));
        detailBox.style.display = "none";
        renderCalendar();
    }
};

document.getElementById("prevMonth").onclick = () => {
    if (currentMonth > 0) currentMonth--;
    renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
    if (currentMonth < 11) currentMonth++;
    renderCalendar();
};

document.getElementById("exportPdf").onclick = () => {
    const monthEvents = events.filter(e =>
        e.days.some(d =>
            d.startsWith(`${YEAR}-${String(currentMonth + 1).padStart(2,"0")}`)
        )
    );

    let html = `
    <html><head><style>
    body{font-family:Arial;padding:20px;}
    table{width:100%;border-collapse:collapse;}
    th,td{border:1px solid #333;padding:8px;font-size:12px;}
    th{background:#eee;}
    </style></head><body>
    <h2>${monthYear.textContent}</h2>
    <table>
    <tr><th>Title</th><th>Date</th><th>Priority</th><th>Team</th><th>Agenda</th></tr>`;

    monthEvents.forEach(e => {
        html += `<tr>
        <td>${e.title}</td>
        <td>${e.startDate} → ${e.endDate}</td>
        <td>${e.priority}</td>
        <td>${e.team || "-"}</td>
        <td>${e.agenda || "-"}</td>
        </tr>`;
    });

    html += `</table></body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.print();
};

document.getElementById("aiStats").onclick = () => {
    const monthEvents = events.filter(e =>
        e.days.some(d =>
            d.startsWith(`${YEAR}-${String(currentMonth + 1).padStart(2,"0")}`)
        )
    );
    const high = monthEvents.filter(e => e.priority === "high").length;
    alert(`📊 AI Analysis\n\nTotal Events: ${monthEvents.length}\nHigh Priority: ${high}`);
};

document.getElementById("agendaSummary").onclick = () => {
    let text = "📅 Monthly Agenda\n\n";
    events.forEach(e => {
        if (e.days.some(d =>
            d.startsWith(`${YEAR}-${String(currentMonth + 1).padStart(2,"0")}`)
        )) {
            text += `• ${e.title} (${e.startDate})\n`;
        }
    });
    alert(text);
};
modal.style.display = "none";
document.body.classList.remove("modal-open"); // 🔥 IMPORTANT


renderCalendar();
