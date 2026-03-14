import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

const EmployeeTaskChart = ({ tasks, isLoading }) => {
  const chartData = useMemo(() => {
    if (!tasks) return [];

    return tasks.map((task) => {
      // Use the virtual field 'totalConsumedHours' provided by your Mongoose model
      const consumed = task.totalConsumedHours || 0;
      const allocated = task.allocatedTime || 0;

      return {
        name: task.title.length > 20 ? task.title.substring(0, 17) + "..." : task.title,
        fullName: task.title,
        consumed: parseFloat(consumed.toFixed(2)),
        allocated: allocated,
        // Calculate efficiency or identify overtime
        isOvertime: consumed > allocated
      };
    });
  }, [tasks]);

  if (isLoading) return (
    <div className="h-[400px] w-full bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 flex items-center justify-center animate-pulse">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Performance Data...</span>
    </div>
  );

  if (!chartData.length) return (
    <div className="h-[400px] w-full bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 flex items-center justify-center">
       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Task History Found</span>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm w-full h-[450px] animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]"></span>
            Workload Distribution
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tight">Individual Task Efficiency (Hours)</p>
        </div>
        
        {/* Simple Legend for Overtime */}
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-[9px] font-black text-slate-500 uppercase">Overtime</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <BarChart 
          data={chartData} 
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ 
              borderRadius: '20px', 
              border: 'none', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              padding: '12px'
            }}
            itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
            labelStyle={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', color: '#64748b' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle" 
            wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingBottom: '20px' }} 
          />
          
          <Bar 
            dataKey="allocated" 
            name="Allocated" 
            fill="#e2e8f0" 
            radius={[6, 6, 0, 0]} 
            barSize={18} 
          />
          
          <Bar 
            dataKey="consumed" 
            name="Consumed" 
            radius={[6, 6, 0, 0]} 
            barSize={18}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isOvertime ? "#f43f5e" : "#f97316"} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmployeeTaskChart;