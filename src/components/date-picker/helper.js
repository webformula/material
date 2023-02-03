import dateUtil from '../../core/dateUtil.js';


export function checkMinMax(minDate, maxDate, displayDate) {
  const previousYearOutOfRange = !minDate ? false : minDate.getFullYear() >= displayDate.getFullYear();
  const nextYearOutOfRange = !maxDate ? false : maxDate.getFullYear() <= displayDate.getFullYear();
  // last day of previous month
  const previousMonthDate = dateUtil.setDateByParts(displayDate, { day: -1 });
  const previousMonthOutOfRange = !minDate ? false : minDate.getTime() > previousMonthDate.getTime();

  // first day of next month
  const nextMonthDate = !maxDate ? '' : dateUtil.setDateByParts(dateUtil.addToDateByParts(displayDate, { month: 1 }), { day: 1 });
  const nextMonthOutOfRange = !maxDate ? false : maxDate.getTime() < nextMonthDate.getTime();

  return {
    previousYearOutOfRange,
    nextYearOutOfRange,
    previousMonthOutOfRange,
    nextMonthOutOfRange
  };
}


export function monthDaysTemplate(date, value, minDate, maxDate, fillPreviousMonth, fillNextMonth, extraRow) {
  return dateUtil.getMonthDays(date, {
    fillPreviousMonth,
    fillNextMonth,
    minDate,
    maxDate,
    extraRow
  }).map(week => week.map(({ display, date, currentMonth, interactive, beforeMinDate, afterMaxDate, isToday }) => {
    let classes = 'mdw-day';
    if (beforeMinDate) classes += ' mdw-before-min-date';
    if (afterMaxDate) classes += ' mdw-after-max-date';
    if (interactive) classes += ' mdw-interactive';
    if (beforeMinDate || afterMaxDate) classes += ' mdw-out-of-range';
    if (isToday && display !== '') classes += ' mdw-today';
    if (!currentMonth) classes += ' mdw-not-current-month';
    const formattedDate = dateUtil.format(date, 'YYYY-MM-dd');
    return /* html */`<div class="${classes}" mdw-date="${formattedDate}" ${value === formattedDate ? 'selected' : ''}>${display}</div>`;
  }).join('\n')).join('\n');
}


export function monthDaysRangeTemplate(date, valueStart, valueEnd, minDate, maxDate, extraRow) {
  const startTime = dateUtil.parse(valueStart).getTime();
  const endTime = dateUtil.parse(valueEnd).getTime();
  const lastDayInMonth = dateUtil.setDateByParts(dateUtil.addToDateByParts(date, { month: 1 }), { day: -1 }).getDate() + 1;

  return dateUtil.getMonthDays(date, {
    fillPreviousMonth: false,
    fillNextMonth: false,
    minDate,
    maxDate,
    extraRow
  }).map(week => week.map(({ display, date, currentMonth, interactive, beforeMinDate, afterMaxDate, isToday, dayOfWeek }) => {
    let classes = `mdw-day mdw-week-day-${dayOfWeek}`;
    if (beforeMinDate) classes += ' mdw-before-min-date';
    if (afterMaxDate) classes += ' mdw-after-max-date';
    if (interactive) classes += ' mdw-interactive';
    if (beforeMinDate || afterMaxDate) classes += ' mdw-out-of-range';
    if (isToday && display !== '') classes += ' mdw-today';
    if (!currentMonth) classes += ' mdw-not-current-month';
    if (currentMonth && date.getDate() === 1) classes += ' mdw-first-day';
    if (currentMonth && date.getDate() === lastDayInMonth) classes += ' mdw-last-day';
    const formattedDate = dateUtil.format(date, 'YYYY-MM-dd');
    const selectedStart = currentMonth && valueStart === formattedDate;
    const selectedEnd = currentMonth && valueEnd === formattedDate;
    const dateTime = date.getTime();
    const inSelectionRange = dateTime > startTime && dateTime < endTime;

    return /* html */`<div class="${classes}" mdw-date="${formattedDate}" ${selectedStart ? 'selected start' : ''} ${selectedEnd ? 'selected end' : ''} ${inSelectionRange ? 'in-selection-range' : ''}>${display}</div>`;
  }).join('\n')).join('\n');
}
