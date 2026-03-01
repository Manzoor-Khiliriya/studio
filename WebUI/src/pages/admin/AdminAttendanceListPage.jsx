import React, { useState, useMemo } from "react";
import { HiOutlineUsers, HiOutlineCalendarDays, HiOutlineFunnel } from "react-icons/hi2";
import { useGetAllAttendanceQuery } from "../../services/attendanceApi";
import { getAdminAttendanceColumns } from "../../utils/adminAttendanceListHelper";

// Components
import Table from "../../components/Table"; // Assuming you have a reusable table
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";

export default function AttendanceManagement() {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  
  // 1. Fetch all attendance data
  const { data: attendanceData, isLoading, isFetching } = useGetAllAttendanceQuery({
    startDate: dateFilter,
    endDate: dateFilter
  });

  // 2. Initialize Columns
  const columns = useMemo(() => getAdminAttendanceColumns(), []);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-orange-500 shadow-lg shadow-orange-500/10">
              <HiOutlineUsers size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Attendance Management</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Attendance Monitoring
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="date" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-black uppercase text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
              />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
              <HiOutlineFunnel size={20} />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged Today</span>
            <span className="text-lg font-black text-slate-900">{attendanceData?.length || 0}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active On-Shift</span>
            <span className="text-lg font-black text-blue-600">
              {attendanceData?.filter(a => !a.clockOut).length || 0}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Shifts</span>
            <span className="text-lg font-black text-emerald-600">
              {attendanceData?.filter(a => a.clockOut).length || 0}
            </span>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
              <Loader />
              <p className="text-[10px] font-black text-slate-400 uppercase animate-pulse">Accessing Personnel Logs...</p>
            </div>
          ) : (
            <Table 
              columns={columns} 
              data={attendanceData || []} 
              rowClassName="hover:bg-slate-50/50 transition-colors cursor-default"
            />
          )}

          {!isLoading && attendanceData?.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                <HiOutlineCalendarDays size={32} />
              </div>
              <h3 className="font-black text-slate-800 uppercase text-sm">No Logs Found</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">No attendance activity recorded for this date</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}