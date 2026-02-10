'use client';

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DocumentSummary, DocumentStatus, STATUS_COLORS } from '@/lib/types';
import { getDocumentSummariesForMonth, getDateKey, updateDocument } from '@/lib/db';

const STATUS_ICONS: Record<DocumentStatus, string> = {
  none: '−',
  ready: '',
  in_progress: '→',
  paused: '⏸',
  completed: '✓',
};

const STATUS_CYCLE: DocumentStatus[] = ['ready', 'in_progress', 'paused', 'completed'];

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

function getNextStatus(status: DocumentStatus): DocumentStatus {
  if (status === 'none') return 'ready';
  const currentIndex = STATUS_CYCLE.indexOf(status);
  if (currentIndex === -1) return 'ready';
  const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
  return STATUS_CYCLE[nextIndex];
}



type WeekDayCell = {
  year: number;
  month: number;
  day: number;
  isOtherMonth: boolean;
  dateKey: string;
};

type WeekRow = {
  weekIndex: number;
  days: WeekDayCell[];
};

function buildWeekRows(year: number, month: number): WeekRow[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevPadding = firstDay;
  const remainder = (firstDay + daysInMonth) % 7;
  const nextPadding = remainder === 0 ? 0 : 7 - remainder;
  const totalDisplayDays = prevPadding + daysInMonth + nextPadding;

  const startDate = new Date(year, month, 1 - prevPadding);
  const weeks: WeekRow[] = [];

  for (let i = 0; i < totalDisplayDays; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    const day = current.getDate();
    const cellYear = current.getFullYear();
    const cellMonth = current.getMonth();
    const isOtherMonth = cellMonth !== month || cellYear !== year;
    const dateKey = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const weekIndex = Math.floor(i / 7);
    if (!weeks[weekIndex]) {
      weeks[weekIndex] = { weekIndex, days: [] };
    }
    weeks[weekIndex].days.push({
      year: cellYear,
      month: cellMonth,
      day,
      isOtherMonth,
      dateKey,
    });
  }

  return weeks;
}

interface MultiDaySegment {
  doc: DocumentSummary;
  weekIndex: number;
  startColumn: number;
  span: number;
  isStart: boolean;
  isEnd: boolean;
}

function buildDocumentSegments(docs: DocumentSummary[], weeks: WeekRow[]): Record<number, MultiDaySegment[]> {
  const segments: Record<number, MultiDaySegment[]> = {};
  
  const docRanges = docs.map(doc => ({
    doc,
    startKey: getDateKey(doc.startDate),
    endKey: getDateKey(doc.endDate),
  }));

  weeks.forEach(week => {
    const weekDateKeys = week.days.map(day => day.dateKey);
    const firstDateKey = weekDateKeys[0];
    const lastDateKey = weekDateKeys[weekDateKeys.length - 1];

    docRanges.forEach(({ doc, startKey, endKey }) => {
      if (endKey < firstDateKey || startKey > lastDateKey) {
        return;
      }

      let startColumn = -1;
      let endColumn = -1;

      for (let i = 0; i < weekDateKeys.length; i++) {
        const dateKey = weekDateKeys[i];
        if (dateKey >= startKey && dateKey <= endKey) {
          startColumn = i + 1;
          break;
        }
      }

      for (let i = weekDateKeys.length - 1; i >= 0; i--) {
        const dateKey = weekDateKeys[i];
        if (dateKey >= startKey && dateKey <= endKey) {
          endColumn = i + 1;
          break;
        }
      }

      if (startColumn === -1 || endColumn === -1) return;

      const span = endColumn - startColumn + 1;
      if (span <= 0) return;

      const isStart = startKey >= firstDateKey && startKey <= lastDateKey;
      const isEnd = endKey >= firstDateKey && endKey <= lastDateKey;

      if (!segments[week.weekIndex]) {
        segments[week.weekIndex] = [];
      }

      segments[week.weekIndex].push({
        doc,
        weekIndex: week.weekIndex,
        startColumn,
        span,
        isStart,
        isEnd,
      });
    });
  });

  Object.values(segments).forEach(array => {
    array.sort((a, b) => a.startColumn - b.startColumn);
  });

  return segments;
}

interface CalendarDayProps {
  year: number;
  month: number;
  day: number;
  isOtherMonth: boolean;
}

const CalendarDay = memo(function CalendarDay({ year, month, day, isOtherMonth }: CalendarDayProps) {
  const router = useRouter();
  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const classNames = [
    'calendar-day',
    isOtherMonth && 'other-month',
    !isOtherMonth && isToday(year, month, day) && 'today',
  ].filter(Boolean).join(' ');

  const handleDayClick = () => {
    if (!isOtherMonth) {
      router.push(`/editor?date=${dateString}`);
    }
  };

  return (
    <div className={classNames} onClick={handleDayClick} style={{ cursor: isOtherMonth ? 'default' : 'pointer' }}>
      <div className="calendar-day-number">{day}</div>
    </div>
  );
});

interface CalendarMultiDayBarProps {
  doc: DocumentSummary;
  startColumn: number;
  span: number;
  isStart: boolean;
  isEnd: boolean;
  lane: number;
  onStatusChange: (docId: string, newStatus: DocumentStatus) => void;
}

const BAR_HEIGHT = 24;
const BAR_GAP = 4;
const BAR_OFFSET = 2;

function CalendarMultiDayBar({ doc, startColumn, span, isStart, isEnd, lane, onStatusChange }: CalendarMultiDayBarProps) {
  const router = useRouter();
  const columnWidth = 100 / 7;
  const leftPercent = (startColumn - 1) * columnWidth;
  const widthPercent = span * columnWidth;
  const topOffset = BAR_OFFSET + lane * (BAR_HEIGHT + BAR_GAP);
  const backgroundColor = STATUS_COLORS[doc.status || 'none'];

  const handleClick = () => {
    router.push(`/editor?id=${doc.id}`);
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentStatus = doc.status || 'none';
    onStatusChange(doc.id, getNextStatus(currentStatus));
  };

  const classNames = [
    'calendar-multi-day-bar',
    isStart ? 'start' : 'no-start',
    isEnd ? 'end' : 'no-end',
  ].join(' ');

  return (
    <div
      className={classNames}
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        top: `${topOffset}px`,
        backgroundColor,
      }}
      title={doc.title || 'Untitled'}
      onClick={handleClick}
    >
      <span className="calendar-status-icon" onClick={handleStatusClick} title="상태 변경">
        {STATUS_ICONS[doc.status || 'none']}
      </span>
      <span className="calendar-doc-title">
        {doc.title || 'Untitled'}
      </span>
    </div>
  );
}

export function Calendar() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [allDocs, setAllDocs] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = await getDocumentSummariesForMonth(currentYear, currentMonth);
      setAllDocs(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleStatusChange = async (docId: string, newStatus: DocumentStatus) => {
    await updateDocument(docId, { status: newStatus });
    setAllDocs(prev => prev.map(doc =>
      doc.id === docId ? { ...doc, status: newStatus } : doc
    ));
  };

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

  const weekRows = useMemo(() => buildWeekRows(currentYear, currentMonth), [currentYear, currentMonth]);
  const segmentsByWeek = useMemo(
    () => buildDocumentSegments(allDocs, weekRows),
    [allDocs, weekRows]
  );

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
            <div className="calendar-loading">Loading...</div>
          ) : (
            weekRows.map(week => {
              const weekBars = segmentsByWeek[week.weekIndex] || [];
              const barAreaHeight = weekBars.length > 0 ? weekBars.length * (BAR_HEIGHT + BAR_GAP) + 4 : 0;
              
              return (
                <div key={`week-${week.weekIndex}`} className="calendar-week-row">
                  <div className="calendar-week-grid">
                    {week.days.map(day => (
                      <CalendarDay
                        key={day.dateKey}
                        year={day.year}
                        month={day.month}
                        day={day.day}
                        isOtherMonth={day.isOtherMonth}
                      />
                    ))}
                  </div>
                  {weekBars.length > 0 && (
                    <div className="calendar-week-bars" style={{ height: `${barAreaHeight}px` }}>
                      {weekBars.map((segment: MultiDaySegment, laneIndex: number) => (
                        <CalendarMultiDayBar
                          key={`${segment.doc.id}-${week.weekIndex}-${laneIndex}`}
                          doc={segment.doc}
                          startColumn={segment.startColumn}
                          span={segment.span}
                          isStart={segment.isStart}
                          isEnd={segment.isEnd}
                          lane={laneIndex}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
