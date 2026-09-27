import React from "react";
import {
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlineClock,
} from "react-icons/hi";

export const getAdminAttendanceColumns = () => [
  {
    header: "Employee Profile",
    render: (row) => (
      <div className="flex items-center gap-3 py-1">
        <div className="flex flex-col">
          <p className="font-black text-slate-800 text-[11px] uppercase tracking-tight">
            {row.user?.name || "Unknown User"}{" "}
            {row.user?.employee?.employeeCode
              ? `(${row.user.employee.employeeCode})`
              : ""}
          </p>
        </div>
      </div>
    ),
  },

  {
    header: "Date",
    render: (row) => (
      <div className="flex items-center gap-3 py-1">
        <p className="text-[10px] text-slate-800 font-black uppercase italic">
          {new Date(row.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    ),
  },

  // ============================================================
  // STATUS
  // ============================================================
  {
    header: "Status",
    render: (row) => {
      const status = row.status || "Not Clocked In";

      const statusColor = {
        "Clocked In": "text-emerald-600",
        "Clocked Out": "text-blue-600",
        "Not Clocked In": "text-red-600",
      };

      return (
        <span
          className={`flex items-center gap-3 py-1 font-black text-[10px] uppercase tracking-tighter ${statusColor[status] || "text-red-600"
            }`}
        >
          {status}
        </span>
      );
    },
  },

  // ============================================================
  // CLOCK IN
  // ============================================================
  {
    header: "Clock In",
    render: (row) => (
      <div
        className={`inline-flex items-center gap-1.5 font-black text-[10px] uppercase tracking-tighter ${row.clockIn
            ? "text-emerald-600"
            : "text-slate-400"
          }`}
      >
        <HiOutlineLogin size={12} />

        {row.clockIn
          ? new Date(row.clockIn).toLocaleTimeString(
            "en-IN",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )
          : "---"}
      </div>
    ),
  },

  // ============================================================
  // CLOCK OUT
  // ============================================================
  {
    header: "Clock Out",
    render: (row) => {
      if (row.status === "Clocked Out" && row.clockOut) {
        return (
          <div className="inline-flex items-center gap-1.5 font-black text-[10px] uppercase tracking-tighter text-blue-600">
            <HiOutlineLogout size={12} />

            {new Date(row.clockOut).toLocaleTimeString(
              "en-IN",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </div>
        );
      }

      if (row.status === "Clocked In") {
        return (
          <div className="inline-flex items-center gap-1.5 font-black text-[10px] uppercase tracking-tighter text-emerald-600">
            <HiOutlineLogout size={12} />

            ON-SHIFT
          </div>
        );
      }

      return (
        <div className="inline-flex items-center gap-1.5 font-black text-[10px] uppercase tracking-tighter text-slate-400">
          <HiOutlineLogout size={12} />

          ---
        </div>
      );
    },
  },

  // ============================================================
  // TOTAL CLOCKED TIME
  // ============================================================
  {
    header: "Total Clocked Time",
    render: (row) => {
      const totalSecs =
        row.totalSecondsWorked || 0;

      const h = Math.floor(
        totalSecs / 3600
      );

      const m = Math.floor(
        (totalSecs % 3600) / 60
      );

      const s = totalSecs % 60;

      return (
        <div className="flex items-center gap-2 py-1 font-black text-slate-800 text-[10px] tabular-nums">
          <HiOutlineClock
            className="text-slate-600"
            size={12}
          />

          <>
            {h > 0 && (
              <span>{h} Hrs</span>
            )}

            {m > 0 || h > 0 ? (
              <span>{m} Mins</span>
            ) : null}

            <span className="text-slate-800 font-black">
              {s} Secs
            </span>
          </>
        </div>
      );
    },
  },
];