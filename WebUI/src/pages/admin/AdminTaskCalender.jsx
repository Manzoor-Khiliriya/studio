import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useGetAllTasksQuery } from '../../services/taskApi';
import { useNavigate } from 'react-router-dom';
import { useGetHolidaysQuery } from '../../services/holidayApi';

const TaskCalendar = () => {
  const navigate = useNavigate();
  
  const { data: tasksData, isLoading: tasksLoading } = useGetAllTasksQuery({ limit: 100 });
  const { data: holidaysData, isLoading: holidaysLoading } = useGetHolidaysQuery();

  // 1. Format Tasks
  const taskEvents = tasksData?.tasks?.map(task => ({
    id: task._id,
    title: task.title,
    start: task.startDate,
    end: task.endDate,
    // Dynamic class based on status for the CSS
    className: `event-card event-${task.liveStatus?.toLowerCase().replace(/\s+/g, '-') || 'default'}`,
    extendedProps: { 
      type: 'task',
      projectNumber: task.projectNumber,
      status: task.liveStatus 
    }
  })) || [];

  // 2. Format Holidays from Backend (Ensuring pure YYYY-MM-DD format)
  const holidayEvents = holidaysData?.map(h => ({
    id: h._id,
    title: h.name || h.title,
    // If h.date is an ISO string, we split it to get just the date part
    start: h.date?.split('T')[0], 
    allDay: true,
    display: 'background',
    className: 'holiday-bg-highlight',
    extendedProps: { type: 'holiday' }
  })) || [];

  // 3. Add Recurring Weekends (Saturday = 6, Sunday = 0)
  const weekendEvents = [
    {
      daysOfWeek: [0, 6], 
      display: 'background',
      className: 'weekend-bg-highlight',
      allDay: true
    }
  ];

  const allEvents = [...taskEvents, ...holidayEvents, ...weekendEvents];

  const handleEventClick = (info) => {
    if (info.event.extendedProps.type === 'task') {
      navigate(`/tasks/${info.event.id}`);
    }
  };

  const renderEventContent = (eventInfo) => {
    // Don't render text for background events (holidays/weekends)
    if (eventInfo.event.display === 'background') return null;
    
    return (
      <div className="flex flex-col px-2 py-1 overflow-hidden">
        <span className="text-[9px] font-bold opacity-75 uppercase truncate leading-tight">
          {eventInfo.event.extendedProps.projectNumber}
        </span>
        <span className="text-xs font-medium truncate leading-tight">
          {eventInfo.event.title}
        </span>
      </div>
    );
  };

  if (tasksLoading || holidaysLoading) {
    return (
      <div className="flex items-center justify-center h-[700px] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-semibold">Synchronizing Schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Project Calendar</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage tasks and track team availability</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/60">
          <Legend color="bg-orange-500" label="In Progress" />
          <Legend color="bg-emerald-500" label="Completed" />
          <Legend color="bg-indigo-600" label="Planned" />
          <div className="h-4 w-px bg-slate-300 mx-2 hidden sm:block" />
          <Legend color="bg-red-100 border border-red-200" label="Holiday" />
          <Legend color="bg-slate-200" label="Weekend" />
        </div>
      </div>

      <div className="modern-calendar-wrapper">
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
          height="750px"
          dayMaxEvents={3}
          fixedWeekCount={false}
          firstDay={1} // Start week on Monday
        />
      </div>
    </div>
  );
};

const Legend = ({ color, label }) => (
  <div className="flex items-center gap-2 px-1">
    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{label}</span>
  </div>
);

export default TaskCalendar;