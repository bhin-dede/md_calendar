'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DocumentSummary, STATUS_COLORS } from '@/lib/types';
import { getDocumentSummariesForMonth, getDateKey } from '@/lib/db';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isToday(year: number, month: number, day: number): boolean {
  const today = new Date();
  return today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;
}

function groupDocumentsByDate(docs: DocumentSummary[]): Record<string, DocumentSummary[]> {
  const grouped: Record<string, DocumentSummary[]> = {};
  docs.forEach(doc => {
    const key = getDateKey(doc.date);
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(doc);
  });
  return grouped;
}

interface CalendarDayProps {
  year: number;
  month: number;
  day: number;
  isOtherMonth: boolean;
  docs: DocumentSummary[];
}

const CalendarDay = memo(function CalendarDay({ year, month, day, isOtherMonth, docs }: CalendarDayProps) {
  const router = useRouter();
  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const classNames = [
    'calendar-day',
    isOtherMonth && 'other-month',
    !isOtherMonth && isToday(year, month, day) && 'today',
    docs.length > 0 && 'has-docs',
  ].filter(Boolean).join(' ');

  const handleDayClick = () => {
    if (!isOtherMonth) {
      router.push(`/editor?date=${dateString}`);
    }
  };

  const handleDocClick = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    router.push(`/editor?id=${docId}`);
  };

  return (
    <div className={classNames} onClick={handleDayClick} style={{ cursor: isOtherMonth ? 'default' : 'pointer' }}>
      <div className="calendar-day-number">{day}</div>
      {docs.length > 0 && (
        <div className="calendar-day-docs">
          {docs.slice(0, 3).map(doc => (
            <div
              key={doc.id}
              className="calendar-doc-item"
              title={doc.title || 'Untitled'}
              onClick={(e) => handleDocClick(e, doc.id)}
              style={{ backgroundColor: STATUS_COLORS[doc.status] }}
            >
              {doc.title || 'Untitled'}
            </div>
          ))}
          {docs.length > 3 && (
            <div className="calendar-more">+{docs.length - 3} more</div>
          )}
        </div>
      )}
    </div>
  );
});

export function Calendar() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [docsByDate, setDocsByDate] = useState<Record<string, DocumentSummary[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = await getDocumentSummariesForMonth(currentYear, currentMonth);
      setDocsByDate(groupDocumentsByDate(docs));
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
    setIsLoading(false);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const navigateMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const goToToday = () => {
    setCurrentYear(new Date().getFullYear());
    setCurrentMonth(new Date().getMonth());
  };

  const renderCalendarGrid = () => {
    const days: React.ReactNode[] = [];
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push(
        <CalendarDay
          key={`prev-${day}`}
          year={prevYear}
          month={prevMonth}
          day={day}
          isOtherMonth={true}
          docs={docsByDate[dateKey] || []}
        />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push(
        <CalendarDay
          key={`current-${day}`}
          year={currentYear}
          month={currentMonth}
          day={day}
          isOtherMonth={false}
          docs={docsByDate[dateKey] || []}
        />
      );
    }

    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    for (let day = 1; day <= remainingCells; day++) {
      const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push(
        <CalendarDay
          key={`next-${day}`}
          year={nextYear}
          month={nextMonth}
          day={day}
          isOtherMonth={true}
          docs={docsByDate[dateKey] || []}
        />
      );
    }

    return days;
  };

  return (
    <div className="app-container view-calendar">
      <div className="page-header">
        <h2 className="page-title">Calendar</h2>
        <div className="page-actions">
          <Link href="/editor" className="btn btn-primary">
            + New Document
          </Link>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-header">
          <div className="calendar-nav">
            <button
              className="btn btn-sm"
              style={{ backgroundColor: 'white' }}
              onClick={() => navigateMonth(-1)}
            >
              &#9664;
            </button>
            <button
              className="btn btn-sm"
              style={{ backgroundColor: 'white' }}
              onClick={goToToday}
            >
              Today
            </button>
            <button
              className="btn btn-sm"
              style={{ backgroundColor: 'white' }}
              onClick={() => navigateMonth(1)}
            >
              &#9654;
            </button>
          </div>
          <div className="calendar-title">
            {MONTHS[currentMonth]} {currentYear}
          </div>
          <div style={{ width: '120px' }} />
        </div>

        <div className="calendar-weekdays">
          {WEEKDAYS.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {isLoading ? (
            <div className="loading" style={{ gridColumn: '1 / -1' }}>Loading...</div>
          ) : (
            renderCalendarGrid()
          )}
        </div>
      </div>
    </div>
  );
}
