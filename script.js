/* =========================
   FIREBASE IMPORTS
   ========================= */
import { db } from "./firebase.js";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   DOM REFERENCES
   ========================= */
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const modal = document.getElementById("eventModal");
const detailBox = document.getElementById("eventDetail");
const detailContent = document.getElementById("detailContent");

const sidebar = document.querySelector(".sidebar");
const menuBtn = document.getElementById("menuBtn");

const saveBtn = document.getElementById("saveEvent");

/* =========================
   STATE
   ========================= */
const YEAR = 2026;
let currentMonth = 0;
let events = [];
let selectedEventId = null;

/* =========================
   FIRESTORE REF
   ========================= */
const eventsRef = collection(db, "events2026");

/* =========================
   SIDEBAR TOGGLE
   ========================= */
menuBtn.onclick = () => sidebar.classList.toggle("open");

document.addEventListener("click", (e) => {
    if (
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)
    ) {
        sidebar.classList.remove("open");
    }
});

/* =========================
   REALTIME LISTENER
   ========================= */
function listenToEvents() {
    const q = query(eventsRef, orderBy("createdAt"));

    onSnapshot(q, (snapshot) => {
        events = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));
        renderCalendar();
    });
}

/* =========================
   CALENDAR RENDER
   ========================= */
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

        const dayEvents = events.filter(
            e => Array.isArray(e.days) && e.days.includes(key)
        );

        if (dayEvents.length > 0) {
            const priorityRank = { high: 3, medium: 2, low: 1 };
            const top = dayEvents.reduce((a, b) =>
                priorityRank[b.priority] > priorityRank[a.priority] ? b : a
            );

            cell.classList.add(top.priority);

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

/* =========================
   EVENT DETAIL
   ========================= */
function showEvent(dayKey) {
    const ev = events.find(e => e.days.includes(dayKey));
    if (!ev) return;

    selectedEventId = ev.id;

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

/* =========================
   MODAL CONTROLS
   ========================= */
document.getElementById("addEventBtn").onclick = () => {
    sidebar.classList.remove("open");
    document.body.classList.add("modal-open");
    modal.style.display = "flex";
};

document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
};

/* =========================
   SAVE EVENT (FIXED)
   ========================= */
saveBtn.onclick = async () => {
    if (saveBtn.disabled) return;

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
        const start = new Date(startDate.value + "T00:00:00");
        const recurrence = document.getElementById("recurrence").value;

        let end;
        if (recurrence === "none") {
            const endInput = endDate.value || startDate.value;
            end = new Date(endInput + "T23:59:59");
        } else {
            end = new Date(YEAR, 11, 31, 23, 59, 59);
        }

        const days = [];
        let cursor = new Date(start);

        while (cursor <= end) {
            days.push(
                `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`
            );

            if (recurrence === "daily") cursor.setDate(cursor.getDate() + 1);
            else if (recurrence === "weekly") cursor.setDate(cursor.getDate() + 7);
            else if (recurrence === "monthly") cursor.setMonth(cursor.getMonth() + 1);
            else cursor.setDate(cursor.getDate() + 1);
        }

        await addDoc(eventsRef, {
            title: title.value,
            startDate: startDate.value,
            endDate: endDate.value || startDate.value,
            priority: priority.value,
            team: team.value,
            meetingLink: meetingLink.value,
            agenda: agenda.value,
            recurrence,
            days,
            createdAt: Date.now()
        });

        modal.style.display = "none";
        document.body.classList.remove("modal-open");

    } catch (err) {
        console.error("Save failed:", err);
        alert("Failed to save event. Check console.");
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save";
    }
};

/* =========================
   DELETE EVENT
   ========================= */
document.getElementById("deleteEvent").onclick = async () => {
    if (!selectedEventId) return;
    await deleteDoc(doc(db, "events2026", selectedEventId));
    detailBox.style.display = "none";
};

/* =========================
   MONTH NAVIGATION
   ========================= */
document.getElementById("prevMonth").onclick = () => {
    if (currentMonth > 0) {
        currentMonth--;
        renderCalendar();
    }
};

document.getElementById("nextMonth").onclick = () => {
    if (currentMonth < 11) {
        currentMonth++;
        renderCalendar();
    }
};
document.getElementById("exportPdf").onclick = () => {
    sidebar.classList.remove("open");

    const monthKey = `${YEAR}-${String(currentMonth + 1).padStart(2, "0")}`;

    const monthEvents = events.filter(e =>
        e.days.some(d => d.startsWith(monthKey))
    );

    if (monthEvents.length === 0) {
        alert("No events for this month");
        return;
    }

    let html = `
    <html>
    <head>
        <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #333; padding: 8px; font-size: 12px; }
            th { background: #eee; }
        </style>
    </head>
    <body>
        <h2>${monthYear.textContent}</h2>
        <table>
            <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Team</th>
                <th>Agenda</th>
            </tr>`;

    monthEvents.forEach(e => {
        html += `
        <tr>
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
    sidebar.classList.remove("open");

    const monthKey = `${YEAR}-${String(currentMonth + 1).padStart(2, "0")}`;

    const monthEvents = events.filter(e =>
        e.days.some(d => d.startsWith(monthKey))
    );

    const high = monthEvents.filter(e => e.priority === "high").length;
    const medium = monthEvents.filter(e => e.priority === "medium").length;
    const low = monthEvents.filter(e => e.priority === "low").length;

    alert(
        `📊 AI Monthly Stats\n\n` +
        `Total Events: ${monthEvents.length}\n` +
        `High Priority: ${high}\n` +
        `Medium Priority: ${medium}\n` +
        `Low Priority: ${low}`
    );
};
document.getElementById("agendaSummary").onclick = () => {
    sidebar.classList.remove("open");

    const monthKey = `${YEAR}-${String(currentMonth + 1).padStart(2, "0")}`;

    const monthEvents = events.filter(e =>
        e.days.some(d => d.startsWith(monthKey))
    );

    if (monthEvents.length === 0) {
        alert("No agenda for this month");
        return;
    }

    let text = "📅 Monthly Agenda\n\n";

    monthEvents.forEach(e => {
        text += `• ${e.title} (${e.startDate})\n`;
    });

    alert(text);
};

/* =========================
   START APP
   ========================= */
listenToEvents();
renderCalendar();