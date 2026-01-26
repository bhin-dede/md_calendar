import { getDocumentsForMonth, getDateKey } from '../db.js';
import router from '../router.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let currentContainer = null;

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isToday(year, month, day) {
  const today = new Date();
  return today.getFullYear() === year && 
         today.getMonth() === month && 
         today.getDate() === day;
}

function groupDocumentsByDate(docs) {
  const grouped = {};
  docs.forEach(doc => {
    const key = getDateKey(doc.date);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(doc);
  });
  return grouped;
}

function createCalendarHeader() {
  const header = document.createElement('div');
  header.className = 'calendar-header';
  
  const nav = document.createElement('div');
  nav.className = 'calendar-nav';
  
  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn btn-sm';
  prevBtn.textContent = '◀';
  prevBtn.style.backgroundColor = 'white';
  prevBtn.onclick = () => navigateMonth(-1);
  
  const todayBtn = document.createElement('button');
  todayBtn.className = 'btn btn-sm';
  todayBtn.textContent = 'Today';
  todayBtn.style.backgroundColor = 'white';
  todayBtn.onclick = () => goToToday();
  
  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-sm';
  nextBtn.textContent = '▶';
  nextBtn.style.backgroundColor = 'white';
  nextBtn.onclick = () => navigateMonth(1);
  
  nav.appendChild(prevBtn);
  nav.appendChild(todayBtn);
  nav.appendChild(nextBtn);
  
  const title = document.createElement('div');
  title.className = 'calendar-title';
  title.id = 'calendar-title';
  title.textContent = `${MONTHS[currentMonth]} ${currentYear}`;
  
  const spacer = document.createElement('div');
  spacer.style.width = '120px';
  
  header.appendChild(nav);
  header.appendChild(title);
  header.appendChild(spacer);
  
  return header;
}

function createWeekdaysRow() {
  const row = document.createElement('div');
  row.className = 'calendar-weekdays';
  
  WEEKDAYS.forEach(day => {
    const cell = document.createElement('div');
    cell.className = 'calendar-weekday';
    cell.textContent = day;
    row.appendChild(cell);
  });
  
  return row;
}

function createCalendarDay(year, month, day, isOtherMonth, docsByDate) {
  const cell = document.createElement('div');
  cell.className = 'calendar-day';
  
  if (isOtherMonth) {
    cell.classList.add('other-month');
  }
  
  if (!isOtherMonth && isToday(year, month, day)) {
    cell.classList.add('today');
  }
  
  const dayNum = document.createElement('div');
  dayNum.className = 'calendar-day-number';
  dayNum.textContent = day;
  cell.appendChild(dayNum);
  
  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const docs = docsByDate[dateKey] || [];
  
  if (docs.length > 0) {
    cell.classList.add('has-docs');
    
    const docsContainer = document.createElement('div');
    docsContainer.className = 'calendar-day-docs';
    
    const maxDisplay = 3;
    docs.slice(0, maxDisplay).forEach(doc => {
      const docItem = document.createElement('div');
      docItem.className = 'calendar-doc-item';
      docItem.textContent = doc.title || 'Untitled';
      docItem.title = doc.title || 'Untitled';
      docItem.onclick = (e) => {
        e.stopPropagation();
        router.navigate(`/editor/${doc.id}`);
      };
      docsContainer.appendChild(docItem);
    });
    
    if (docs.length > maxDisplay) {
      const more = document.createElement('div');
      more.className = 'calendar-more';
      more.textContent = `+${docs.length - maxDisplay} more`;
      docsContainer.appendChild(more);
    }
    
    cell.appendChild(docsContainer);
  }
  
  cell.onclick = () => {
    if (!isOtherMonth) {
      const selectedDate = new Date(year, month, day);
      router.navigate(`/editor?date=${selectedDate.getTime()}`);
    }
  };
  
  return cell;
}

async function createCalendarGrid() {
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';
  grid.id = 'calendar-grid';
  
  const docs = await getDocumentsForMonth(currentYear, currentMonth);
  const docsByDate = groupDocumentsByDate(docs);
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    grid.appendChild(createCalendarDay(prevYear, prevMonth, day, true, docsByDate));
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    grid.appendChild(createCalendarDay(currentYear, currentMonth, day, false, docsByDate));
  }
  
  const totalCells = firstDay + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  
  for (let day = 1; day <= remainingCells; day++) {
    grid.appendChild(createCalendarDay(nextYear, nextMonth, day, true, docsByDate));
  }
  
  return grid;
}

async function navigateMonth(delta) {
  currentMonth += delta;
  
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  
  await updateCalendar();
}

async function goToToday() {
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();
  await updateCalendar();
}

async function updateCalendar() {
  const titleEl = document.getElementById('calendar-title');
  if (titleEl) {
    titleEl.textContent = `${MONTHS[currentMonth]} ${currentYear}`;
  }
  
  const oldGrid = document.getElementById('calendar-grid');
  if (oldGrid) {
    const newGrid = await createCalendarGrid();
    oldGrid.replaceWith(newGrid);
  }
}

export async function renderCalendar(container) {
  currentContainer = container;
  
  container.innerHTML = '';
  container.className = 'app-container view-calendar';

  const pageHeader = document.createElement('div');
  pageHeader.className = 'page-header';
  
  const title = document.createElement('h2');
  title.className = 'page-title';
  title.textContent = 'Calendar';
  
  const actions = document.createElement('div');
  actions.className = 'page-actions';
  
  const newBtn = document.createElement('button');
  newBtn.className = 'btn btn-primary';
  newBtn.textContent = '+ New Document';
  newBtn.onclick = () => router.navigate('/editor');
  
  actions.appendChild(newBtn);
  pageHeader.appendChild(title);
  pageHeader.appendChild(actions);

  const calendarContainer = document.createElement('div');
  calendarContainer.className = 'calendar-container';
  
  calendarContainer.appendChild(createCalendarHeader());
  calendarContainer.appendChild(createWeekdaysRow());
  calendarContainer.appendChild(await createCalendarGrid());

  container.appendChild(pageHeader);
  container.appendChild(calendarContainer);
}

export default { renderCalendar };
