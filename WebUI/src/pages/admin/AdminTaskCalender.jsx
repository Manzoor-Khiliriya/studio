import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useGetProjectCalendarQuery } from '../../services/projectApi';
import { useGetHolidaysQuery } from '../../services/holidayApi';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { HiOutlineColorSwatch } from 'react-icons/hi';

const TaskCalendar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: eventsData, isLoading: projectLoading } = useGetProjectCalendarQuery(searchTerm);
  const { data: holidaysData, isLoading: holidaysLoading } = useGetHolidaysQuery();

  const allEvents = useMemo(() => {
    const holidayEvents = (holidaysData || []).map(h => ({
      id: h._id,
      title: h.name || h.title,
      start: h.date?.split('T')[0],
      display: 'background',
      className: 'holiday-bg-highlight',
    }));

    const weekendEvents = [{
      daysOfWeek: [0, 6],
      display: 'background',
      className: 'weekend-bg-highlight',
    }];

    return [...(eventsData || []), ...holidayEvents, ...weekendEvents];
  }, [eventsData, holidaysData]);

  // FIXED: Now navigates to Task Detail Page
  const handleEventClick = (info) => {
    if (info.event.display !== 'background') {
      navigate(`/tasks/${info.event.id}`);
    }
  };

  // FIXED: Project Name first, then Task, decreased height
  const renderEventContent = (eventInfo) => {
    if (eventInfo.event.display === 'background') return null;

    const { projectCode, hasActive } = eventInfo.event.extendedProps;
    const taskTitle = eventInfo.event.title;

    return (
      <div className={`flex flex-col w-full rounded border overflow-hidden mb-0.5 transition-all leading-none ${
        hasActive ? 'border-orange-400 bg-orange-50/50' : 'border-slate-200 bg-white'
      }`}>
        {/* Project Code Header (Very small) */}
        <div className={`${hasActive ? 'bg-orange-500' : 'bg-slate-700'} px-1 py-0.5`}>
          <span className="text-[7px] font-black text-white uppercase tracking-tighter truncate block">
            {projectCode}
          </span>
        </div>
        
        {/* Task Title (Reduced padding and height) */}
        <div className="px-1 py-0.5">
          <span className="text-[9px] font-bold text-slate-700 truncate block lowercase leading-tight">
            {taskTitle}
          </span>
        </div>
      </div>
    );
  };

  if (projectLoading || holidaysLoading) return <LoadingState />;

  return (
    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
              <HiOutlineColorSwatch size={22} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Ops Calendar</h1>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Live Task Mapping</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20 w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="modern-calendar-wrapper border border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50/30 p-2">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={allEvents}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          height="auto"
          dayMaxEvents={5}
          fixedWeekCount={false}
          firstDay={1}
          displayEventTime={false}
          eventDisplay="block"
        />
      </div>

      <style>{`
        .fc-daygrid-day-frame { min-height: 80px !important; padding: 2px !important; }
        .fc-event { background: transparent !important; border: none !important; margin-bottom: 1px !important; }
        .holiday-bg-highlight { background-color: rgba(254, 226, 226, 0.4) !important; }
        .weekend-bg-highlight { background-color: rgba(241, 245, 249, 0.5) !important; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9 !important; }
        .fc-col-header-cell { background: #f8fafc; padding: 10px 0 !important; }
        .fc-col-header-cell-cushion { font-size: 8px; font-weight: 900; text-transform: uppercase; color: #64748b; }
      `}</style>
    </div>
  );
};

const LoadingState = () => (
  <div className="flex items-center justify-center h-[500px] bg-slate-50 rounded-[3rem]">
    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default TaskCalendar;