// Pure helpers for optional, self-configured per-vehicle maintenance
// reminders (ServiceLog). A reminder is "due" by hours run since a baseline
// reading, by time elapsed since a baseline date, or both — the standard
// "every 250 hrs or 6 months, whichever comes first" convention most
// equipment maintenance schedules already use. Extracted to core so
// ServiceLog's own fleet view and Home's dashboard card share one source of
// truth instead of computing this twice and risking drift.
//
// A reminder record: { id, label, intervalHours, intervalMonths, baselineHours, baselineDate }
// intervalHours/intervalMonths are both optional — a reminder can be set up
// with either one alone, or both together (due when the FIRST one hits).

export function monthsSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr);
  if (isNaN(then.getTime())) return null;
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12
    + (now.getMonth() - then.getMonth())
    + (now.getDate() - then.getDate()) / 30;
}

// Evaluates a single reminder against a vehicle's current hours reading.
export function evaluateReminder(reminder, currentHours) {
  const hrs = parseFloat(currentHours) || 0;
  const baseHrs = parseFloat(reminder?.baselineHours) || 0;
  const intervalHours = parseFloat(reminder?.intervalHours) || 0;
  const intervalMonths = parseFloat(reminder?.intervalMonths) || 0;
  const hoursSince = hrs - baseHrs;
  const dueByHours = intervalHours > 0 && hoursSince >= intervalHours;
  const monthsElapsed = reminder?.baselineDate ? monthsSince(reminder.baselineDate) : null;
  const dueByDate = intervalMonths > 0 && monthsElapsed != null && monthsElapsed >= intervalMonths;
  return {
    due: dueByHours || dueByDate,
    dueByHours, dueByDate,
    hoursSince,
    hoursOver: dueByHours ? Math.max(0, hoursSince - intervalHours) : 0,
    monthsElapsed,
  };
}

// Flat list of every currently-due reminder across a vehicle list — used by
// both ServiceLog's fleet view and Home's summary card.
export function findDueReminders(vehicles) {
  const out = [];
  (vehicles || []).forEach(v => {
    (v?.maintReminders || []).forEach(r => {
      const evalResult = evaluateReminder(r, v.hours);
      if (evalResult.due) out.push({ vehicleId: v.id, vehicleName: v.name, reminder: r, ...evalResult });
    });
  });
  return out;
}
