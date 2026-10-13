/**
 * Billing utility for IPD Calendar-Day Stay calculation.
 * HR billing rule:
 * - Billing uses calendar days, not completed 24-hour periods.
 * - Same-day admission and discharge = ONE calendar day.
 * - 7 October late admission and 8 October early discharge = TWO calendar days.
 * calendarDays = calendar date of discharge − calendar date of admission + 1
 */

export function calculateCalendarDays(admissionDate, dischargeDate = new Date(), timeZone = 'Asia/Kolkata') {
  if (!admissionDate) return 1;
  try {
    const getLocalDateString = (d) => {
      const dateObj = new Date(d);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      return formatter.format(dateObj); // "YYYY-MM-DD"
    };

    const admStr = getLocalDateString(admissionDate);
    const disStr = getLocalDateString(dischargeDate);

    const admDateUtc = new Date(`${admStr}T00:00:00Z`);
    const disDateUtc = new Date(`${disStr}T00:00:00Z`);

    const diffMs = disDateUtc.getTime() - admDateUtc.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  } catch (_) {
    return 1;
  }
}

export function computeBedCharge(dailyRate, calendarDays) {
  if (dailyRate === undefined || dailyRate === null || isNaN(Number(dailyRate))) {
    return {
      dailyRate: null,
      calendarDays,
      totalBedCharge: null,
      isRateConfigured: false,
      warning: 'Bed daily rate is not configured'
    };
  }
  const rateNum = Number(dailyRate);
  return {
    dailyRate: rateNum,
    calendarDays,
    totalBedCharge: rateNum * calendarDays,
    isRateConfigured: true,
    warning: null
  };
}
