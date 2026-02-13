'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DocumentSummary, DocumentStatus, STATUS_COLORS } from '@/lib/types';
import { getDocumentSummariesForMonth, updateDocument } from '@/lib/db';
import { useToast } from '@/context/ToastContext';

const isDev = process.env.NODE_ENV === 'development';

// date-fns localizer setup
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Status icons for display
const STATUS_ICONS: Record<DocumentStatus, string> = {
  none: '−',
  ready: '',
  in_progress: '→',
  paused: '⏸',
  completed: '✓',
};

// Cycle through statuses
const STATUS_CYCLE: DocumentStatus[] = ['ready', 'in_progress', 'paused', 'completed'];

function getNextStatus(status: DocumentStatus): DocumentStatus {
  if (status === 'none') return 'ready';
  const currentIndex = STATUS_CYCLE.indexOf(status);
  if (currentIndex === -1) return 'ready';
  const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
  return STATUS_CYCLE[nextIndex];
}

// Calendar event type
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    status: DocumentStatus;
    doc: DocumentSummary;
  };
}

// Custom event component
interface EventProps {
  event: CalendarEvent;
  onStatusChange: (docId: string, newStatus: DocumentStatus) => void;
}

function EventComponent({ event, onStatusChange }: EventProps) {
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentStatus = event.resource.status || 'none';
    onStatusChange(event.id, getNextStatus(currentStatus));
  };

  return (
    <div className="calendar-event-content">
      <span 
        className="calendar-status-icon" 
        onClick={handleStatusClick}
        title="상태 변경"
        style={{ cursor: 'pointer', marginRight: '4px' }}
      >
        {STATUS_ICONS[event.resource.status || 'none']}
      </span>
      <span className="calendar-event-title">{event.title || 'Untitled'}</span>
    </div>
  );
}

export function BigCalendar() {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<View>('month');

  // Load documents for the visible range (current month + buffer)
  const loadDocuments = useCallback(async (date: Date) => {
    setIsLoading(true);
    try {
      // Load current month, previous month, and next month for smooth navigation
      const currentMonth = date.getMonth();
      const currentYear = date.getFullYear();
      
      const prevDate = subMonths(date, 1);
      const nextDate = addMonths(date, 1);
      
      const [prevDocs, currentDocs, nextDocs] = await Promise.all([
        getDocumentSummariesForMonth(prevDate.getFullYear(), prevDate.getMonth()),
        getDocumentSummariesForMonth(currentYear, currentMonth),
        getDocumentSummariesForMonth(nextDate.getFullYear(), nextDate.getMonth()),
      ]);
      
      // Combine and deduplicate by id
      const allDocs = [...prevDocs, ...currentDocs, ...nextDocs];
      const uniqueDocs = Array.from(
        new Map(allDocs.map(doc => [doc.id, doc])).values()
      );
      
      setDocuments(uniqueDocs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments(currentDate);
  }, [currentDate, loadDocuments]);

  // Handle status change
  const handleStatusChange = useCallback(async (docId: string, newStatus: DocumentStatus) => {
    await updateDocument(docId, { status: newStatus });
    setDocuments(prev => prev.map(doc =>
      doc.id === docId ? { ...doc, status: newStatus } : doc
    ));
  }, []);

  // Convert documents to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return documents.map(doc => {
      // For end date, add 1 day because react-big-calendar treats end as exclusive
      const endDate = new Date(doc.endDate);
      endDate.setDate(endDate.getDate() + 1);
      
      return {
        id: doc.id,
        title: doc.title || 'Untitled',
        start: new Date(doc.startDate),
        end: endDate,
        allDay: true,
        resource: {
          status: doc.status,
          doc,
        },
      };
    });
  }, [documents]);

  // Handle event click - navigate to editor
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    router.push(`/editor?id=${event.id}`);
  }, [router]);

  // Handle slot select - create new document
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    const dateString = format(slotInfo.start, 'yyyy-MM-dd');
    router.push(`/editor?date=${dateString}`);
  }, [router]);

  // Handle navigation
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    if (!isDev && newView !== 'month') {
      showToast('준비중입니다.', 'info');
      return;
    }
    setView(newView);
  }, [showToast]);

  // Style events based on status
  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status || 'none';
    const backgroundColor = STATUS_COLORS[status];
    
    return {
      className: `status-${status}`,
      style: {
        backgroundColor,
        border: '2px solid var(--color-border)',
        color: 'var(--color-text)',
      },
    };
  }, []);

  // Custom components with status change handler
  const components = useMemo(() => ({
    event: (props: { event: CalendarEvent }) => (
      <EventComponent event={props.event} onStatusChange={handleStatusChange} />
    ),
  }), [handleStatusChange]);

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
        {isLoading && documents.length === 0 ? (
          <div className="calendar-loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            Loading...
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            onView={handleViewChange}
            views={['month', 'week', 'day', 'agenda']}
            date={currentDate}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventPropGetter}
            components={components}
            popup
            showMultiDayTimes={false}
            length={30}
            messages={{
              noEventsInRange: '이 기간에 문서가 없습니다.',
              showMore: (total: number) => `+${total}개 더보기`,
            }}
          />
        )}
      </div>
    </div>
  );
}
