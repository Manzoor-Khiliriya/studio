import React from "react";
import { useGetMyEmployeeProfileQuery } from "../../services/employeeApi";
import PageHeader from "../../components/PageHeader";

export default function EmployeeProfilePage() {
    const { data, isLoading, isError } = useGetMyEmployeeProfileQuery();

    const isOnline = (lastActiveAt) => {
        if (!lastActiveAt) return false;
        return Date.now() - new Date(lastActiveAt).getTime() < 60000;
    };

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

    if (isLoading) return <div className="p-6 font-bold">Loading profile...</div>;
    if (isError || !data)
        return <div className="p-6 text-red-500">Failed to load profile</div>;

    const user = data.user;

    return (
        <div className="max-w-[1750px] mx-auto h-[90vh] bg-slate-100">

            {/* 🔥 PAGE HEADER */}
            <PageHeader
                title="My Profile"
                subtitle="View your personal and professional information"
            />

            {/* 🔥 MAIN CONTENT */}
            <main className="max-w-[1750px] mx-auto px-8 pb-10 -mt-10">

                {/* 🔥 PROFILE CARD */}
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-8 space-y-8">


                    {/* BASIC INFO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Full Name" value={user?.name} />
                        <Field label="Email Address" value={user?.email} />
                        <Field label="Employee Code" value={data.employeeCode} />
                        <Field label="Designation" value={data.designation} />

                        {/* PERSONAL INFO */}
                        <Field
                            label="Date of Birth"
                            value={data?.dateOfBirth ? formatDate(data.dateOfBirth) : "-"}
                        />
                        <Field
                            label="Joined Date"
                            value={data?.joinedDate ? formatDate(data.joinedDate) : "-"}
                        />
                    </div>

                </div>
            </main>
        </div>
    );
}

/* 🔥 FIELD COMPONENT */
function Field({ label, value }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {label}
            </span>
            <span className="text-sm font-bold text-slate-800">
                {value || "-"}
            </span>
        </div>
    );
}