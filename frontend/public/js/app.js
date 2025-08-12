function cancelAppointment(id) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    fetch(`/patient/appointment/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if (data.success) location.reload();
    })
    .catch(err => console.error(err));
}

function rescheduleAppointment(id) {
    const newDate = prompt("Enter new date (YYYY-MM-DD):");
    const newTime = prompt("Enter new time (HH:MM):");

    if (!newDate || !newTime) return alert("Reschedule cancelled.");

    fetch(`/patient/appointment/${id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, time: newTime })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        if (data.success) location.reload();
    })
    .catch(err => console.error(err));
}
