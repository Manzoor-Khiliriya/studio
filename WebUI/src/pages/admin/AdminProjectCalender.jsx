import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useGetProjectCalendarQuery } from '../../services/projectApi';
import { useGetHolidaysQuery } from '../../services/holidayApi';
import { useNavigate } from 'react-router-dom';
import { HiChevronDown, HiChevronUp, HiOutlineQueueList, HiOutlineFlag } from 'react-icons/hi2';
import { useSocketEvents } from '../../hooks/useSocketEvents';

const AdminProjectCalendar = () => {
  const navigate = useNavigate();
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [hoveredProjectId, setHoveredProjectId] = useState(null);

  const { data: projectStacks, refetch: refetchProjects } = useGetProjectCalendarQuery("");
  const { data: holidaysData, refetch: refetchHolidays } = useGetHolidaysQuery();

  useSocketEvents({
    onProjectChange: refetchProjects,
    onTaskChange: refetchProjects,
    onHolidayChange: refetchHolidays,
  });

  const toggleProject = (projectId, e) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const allEvents = useMemo(() => {
    // 1. Holiday Events
    const holidayEvents = (holidaysData || []).map(h => ({
      start: h.date?.split('T')[0],
      display: 'background',
      className: 'holiday-bg-highlight',
    }));

    // 2. Project Events
    const projectEvents = (projectStacks || []).map(p => {
      const isDeadline = activeTab === 'deadline';
      return {
        id: p.id,
        title: p.title,
        start: isDeadline ? p.end : p.start,
        end: p.end,
        allDay: true,
        extendedProps: {
          projectCode: p.extendedProps.projectCode,
          tasks: p.extendedProps.tasks,
          taskCount: p.extendedProps.taskCount,
          isDeadlineView: isDeadline
        }
      };
    });

    return [...projectEvents, ...holidayEvents];
  }, [projectStacks, holidaysData, activeTab]);

  const renderEventContent = (eventInfo) => {
    if (eventInfo.event.display === 'background') return null;

    const { projectCode, tasks, taskCount, isDeadlineView } = eventInfo.event.extendedProps;
    const projectId = eventInfo.event.id;
    const isExpanded = expandedProjects.has(projectId);

    const isHovered = hoveredProjectId === projectId;
    const isFirstSegment = eventInfo.isStart;

    return (
      <div
        className={`relative flex flex-col w-full rounded-xl border transition-all duration-200 
          ${isExpanded ? 'z-50 ring-2 ring-indigo-500/20 border-indigo-400' : 'z-10'}
          ${isHovered && !isExpanded ? ' border-orange-500 shadow-md z-40' : 'border-slate-200 shadow-sm'}
        `}
        onMouseEnter={() => setHoveredProjectId(projectId)}
        onMouseLeave={() => setHoveredProjectId(null)}
      >
        <div
          onClick={(e) => toggleProject(projectId, e)}
          className={`cursor-pointer px-2 py-0.5 flex justify-between items-center transition-colors ${isExpanded
            ? (isDeadlineView ? 'bg-rose-600 rounded-t-xl' : 'bg-indigo-600 rounded-t-xl')
            : (isHovered
              ? 'bg-orange-600 rounded-xl' // Different color for hover state
              : (isDeadlineView ? 'bg-rose-800 rounded-xl hover:bg-rose-700' : 'bg-slate-800 rounded-xl hover:bg-slate-700'))
            }`}
        >
          <span className="text-[9px] font-bold text-white truncate uppercase italic">
            {eventInfo.event.title} ({projectCode})
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[7px] font-black text-white bg-white/10 px-1 rounded uppercase tracking-tighter">{taskCount}</span>
            {isExpanded ? <HiChevronUp size={12} className="text-white" /> : <HiChevronDown size={12} className="text-white" />}
          </div>
        </div>

        {isExpanded && isFirstSegment && (
          <div className="relative w-full bg-white border-x border-b border-slate-200 rounded-b-xl shadow-inner overflow-hidden z-20 p-2">
            <div className="space-y-1.5">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-2 border-b border-slate-100 pb-1">Tasks</p>
              {tasks?.map((task) => (
                <div
                  key={task._id}
                  onClick={(e) => { e.stopPropagation(); navigate(`/projects/${task._id}`); }}
                  className="group flex flex-col p-2 bg-slate-50 rounded-lg border border-transparent hover:border-indigo-200 hover:bg-white cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${task.liveStatus === 'In progress'
                      ? 'bg-orange-500'
                      : task.liveStatus === 'Started'
                        ? 'bg-blue-500'
                        : 'bg-slate-300'
                      }`} />
                    <span className="text-[9px] font-bold text-slate-700 group-hover:text-indigo-600 truncate">{task.title}</span>
                  </div>
                  <span className={`text-[7px] font-black uppercase ml-3.5 ${task.liveStatus === 'In progress'
                    ? 'text-orange-500'
                    : task.liveStatus === 'Started'
                      ? 'text-blue-500'
                      : 'text-slate-400'
                    }`}>
                    {task.liveStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const pageTitle = "Project Calendar";
  const iconText = pageTitle.charAt(0).toUpperCase();

  return (
    <div className="max-w-[1750px] mx-auto  p-8 bg-slate-100 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-2xl italic shadow-lg shadow-orange-200">
              {iconText}
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{pageTitle}</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium ml-1">
            {activeTab === 'all' ? "Full Project Timeline" : "Deadline View"}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button
            onClick={() => { setActiveTab('all'); setExpandedProjects(new Set()); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'all' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <HiOutlineQueueList size={16} />
            All Project Dates
          </button>
          <button
            onClick={() => { setActiveTab('deadline'); setExpandedProjects(new Set()); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'deadline' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <HiOutlineFlag size={16} />
            Deadlines Only
          </button>
        </div>
      </div>

      <div className="modern-calendar-wrapper border border-slate-100 rounded-md overflow-hidden bg-slate-50/20 p-2">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={allEvents}
          eventContent={renderEventContent}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
          height="auto"
          dayMaxEvents={false}
          displayEventTime={false}
          fixedWeekCount={false}
          eventClick={(info) => info.jsEvent.preventDefault()}
        />
      </div>
    </div>
  );
};

export default AdminProjectCalendar;