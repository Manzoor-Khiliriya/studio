import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useGetAllTasksQuery } from '../../services/taskApi';
import { useNavigate } from 'react-router-dom';
import { useGetHolidaysQuery } from '../../services/holidayApi';
import { HiOutlineColorSwatch, HiOutlineFilter } from 'react-icons/hi';

const TaskCalendar = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState('All');
  
  // Fetch more tasks to ensure we see the full project timeline
  const { data: tasksData, isLoading: tasksLoading } = useGetAllTasksQuery({ limit: 1000 });
  const { data: holidaysData, isLoading: holidaysLoading } = useGetHolidaysQuery();

  // 1. Get unique project list for the filter
  const projects = useMemo(() => {
    if (!tasksData?.tasks) return [];
    const unique = [...new Set(tasksData.tasks.map(t => t.project?.projectNumber).filter(Boolean))];
    return unique.sort();
  }, [tasksData]);

  // 2. Format & Filter Events
  const allEvents = useMemo(() => {
    const taskEvents = (tasksData?.tasks || [])
      .filter(task => selectedProject === 'All' || task.project?.projectNumber === selectedProject)
      .map(task => ({
        id: task._id,
        title: task.title,
        start: task.startDate,
        end: task.endDate,
        // Using liveStatus for color coding
        className: `event-card event-${task.liveStatus?.toLowerCase().replace(/\s+/g, '-') || 'default'}`,
        extendedProps: { 
          type: 'task',
          projectNumber: task.project?.projectNumber || 'N/A',
          projectTitle: task.project?.title || 'No Project',
          status: task.liveStatus 
        }
      }));

    const holidayEvents = (holidaysData || []).map(h => ({
      id: h._id,
      title: h.name || h.title,
      start: h.date?.split('T')[0], 
      allDay: true,
      display: 'background',
      className: 'holiday-bg-highlight',
      extendedProps: { type: 'holiday' }
    }));

    const weekendEvents = [{
      daysOfWeek: [0, 6], 
      display: 'background',
      className: 'weekend-bg-highlight',
      allDay: true
    }];

    return [...taskEvents, ...holidayEvents, ...weekendEvents];
  }, [tasksData, holidaysData, selectedProject]);

  const handleEventClick = (info) => {
    if (info.event.extendedProps.type === 'task') {
      navigate(`/tasks/${info.event.id}`);
    }
  };

  // 3. Custom Content: Highlights Project Number + Task Title
  const renderEventContent = (eventInfo) => {
    if (eventInfo.event.display === 'background') return null;
    
    const { projectNumber, status } = eventInfo.event.extendedProps;
    
    return (
      <div className="flex flex-col px-2 py-1.5 overflow-hidden border-l-4 border-black/20 group">
        <div className="flex justify-between items-center gap-1 mb-0.5">
          <span className="text-[8px] font-black opacity-90 uppercase tracking-tighter truncate bg-black/10 px-1 rounded">
            {projectNumber}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
        </div>
        <span className="text-[11px] font-bold truncate leading-tight group-hover:whitespace-normal transition-all">
          {eventInfo.event.title}
        </span>
      </div>
    );
  };

  if (tasksLoading || holidaysLoading) return <LoadingState />;

  return (
    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
      
      {/* --- HEADER & FILTERS --- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <HiOutlineColorSwatch size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Operations Map</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Visualization of mission timelines and team availability</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Project Dropdown Filter */}
          <div className="relative">
            <HiOutlineFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              <option value="All">All Projects</option>
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/60">
            <Legend color="bg-orange-500" label="In Progress" />
            <Legend color="bg-emerald-500" label="Done" />
            <div className="h-4 w-px bg-slate-300 mx-1" />
            <Legend color="bg-red-200" label="Holiday" />
          </div>
        </div>
      </div>

      {/* --- CALENDAR --- */}
      <div className="modern-calendar-wrapper border border-slate-100 rounded-[2rem] overflow-hidden shadow-inner bg-slate-50/30">
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
          height="800px"
          dayMaxEvents={4}
          fixedWeekCount={false}
          firstDay={1}
        />
      </div>
    </div>
  );
};

// Helper Components
const Legend = ({ color, label }) => (
  <div className="flex items-center gap-2 px-1">
    <div className={`w-2 h-2 rounded-full ${color}`} />
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
  </div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center h-[700px] bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Mapping Strategic Timelines...</p>
    </div>
  </div>
);

export default TaskCalendar;