import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useGetProjectCalendarQuery } from '../../services/projectApi';
import { useGetHolidaysQuery } from '../../services/holidayApi';
import { useNavigate } from 'react-router-dom';
import { HiChevronDown, HiChevronUp, HiOutlineQueueList, HiOutlineFlag } from 'react-icons/hi2';
import { HiOutlineColorSwatch } from 'react-icons/hi';

const TaskCalendar = () => {
  const navigate = useNavigate();
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'deadline'

  const { data: projectStacks } = useGetProjectCalendarQuery("");
  const { data: holidaysData } = useGetHolidaysQuery();

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
    const holidayEvents = (holidaysData || []).map(h => ({
      start: h.date?.split('T')[0],
      display: 'background',
      className: 'holiday-bg-highlight',
    }));

    const projectEvents = (projectStacks || []).map(p => {
      const isDeadline = activeTab === 'deadline';
      return {
        id: p.id,
        title: p.title,
        // ALL TASK VIEW: Spans from p.start to p.end
        // DEADLINE VIEW: Only shows on p.end
        start: isDeadline ? p.end : p.start,
        end: isDeadline ? p.end : p.end, 
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
    const isExpanded = expandedProjects.has(eventInfo.event.id);
    
    // To prevent the accordion from appearing multiple times on a long bar,
    // we only show the content on the FIRST segment of the event.
    const isFirstSegment = eventInfo.isStart;

    return (
      <div className={`relative flex flex-col w-full rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 ${isExpanded ? 'z-50 ring-2 ring-indigo-500/20' : 'z-10'}`}>
        
        <div 
          onClick={(e) => toggleProject(eventInfo.event.id, e)}
          className={`cursor-pointer px-2 py-1.5 flex justify-between items-center transition-colors ${
            isExpanded 
              ? (isDeadlineView ? 'bg-rose-600 rounded-t-xl' : 'bg-indigo-600 rounded-t-xl') 
              : (isDeadlineView ? 'bg-rose-800 rounded-xl hover:bg-rose-700' : 'bg-slate-800 rounded-xl hover:bg-slate-700')
          }`}
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[7px] font-black text-white/70 uppercase leading-none mb-0.5">
              {projectCode} {isDeadlineView && "• DEADLINE"}
            </span>
            <span className="text-[9px] font-bold text-white truncate max-w-[120px] leading-none uppercase italic">
              {eventInfo.event.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[7px] font-black text-white bg-white/10 px-1 rounded uppercase tracking-tighter">
              {taskCount}
            </span>
            {isExpanded ? <HiChevronUp size={12} className="text-white" /> : <HiChevronDown size={12} className="text-white" />}
          </div>
        </div>
        
        {/* Expanded task area - Now Relative to push other events down */}
        {isExpanded && isFirstSegment && (
          <div className="relative w-full bg-white border-x border-b border-slate-200 rounded-b-xl shadow-inner overflow-hidden z-20 p-2">
            <div className="space-y-1.5">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-2 border-b border-slate-100 pb-1">Project Tasks</p>
              {tasks?.map((task) => (
                <div 
                  key={task._id}
                  onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${task._id}`); }}
                  className="group flex flex-col p-2 bg-slate-50 rounded-lg border border-transparent hover:border-indigo-200 hover:bg-white cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${task.liveStatus === 'In progress' ? 'bg-orange-500' : 'bg-slate-300'}`} />
                    <span className="text-[9px] font-bold text-slate-700 group-hover:text-indigo-600 truncate">{task.title}</span>
                  </div>
                  <span className="text-[7px] font-black text-slate-400 uppercase ml-3.5">{task.liveStatus}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
              <HiOutlineColorSwatch size={22} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Ops Stack</h1>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-1">
            {activeTab === 'all' ? "Full Project Timeline" : "Deadline View"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button 
            onClick={() => { setActiveTab('all'); setExpandedProjects(new Set()); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'all' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HiOutlineQueueList size={16} />
            All Project Dates
          </button>
          <button 
            onClick={() => { setActiveTab('deadline'); setExpandedProjects(new Set()); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'deadline' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HiOutlineFlag size={16} />
            Deadlines Only
          </button>
        </div>
      </div>

      <div className="modern-calendar-wrapper border border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50/20 p-2">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={allEvents}
          eventContent={renderEventContent}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
          height="auto"
          dayMaxEvents={false}
          displayEventTime={false}
          eventClick={(info) => info.jsEvent.preventDefault()}
        />
      </div>

      <style>{`
        .fc-daygrid-day-frame { overflow: visible !important; min-height: 120px !important; }
        .fc-daygrid-event-harness { z-index: 10 !important; margin-bottom: 4px !important; }
        .fc-event { background: transparent !important; border: none !important; cursor: default !important; }
        .holiday-bg-highlight { background-color: rgba(254, 226, 226, 0.4) !important; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9 !important; }
        .fc-daygrid-event { white-space: normal !important; }
      `}</style>
    </div>
  );
};

export default TaskCalendar;