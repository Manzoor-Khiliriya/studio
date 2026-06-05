import { useState } from "react";
import DepartmentList from "./DepartmentList";
import DesignationList from "./DesignationList";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Department");

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-6">
      <div className="flex gap-3 mb-6">
        {["Department", "Designation"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-xs font-bold ${
              activeTab === tab
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Department" ? (
        <DepartmentList />
      ) : (
        <DesignationList />
      )}
    </div>
  );
}