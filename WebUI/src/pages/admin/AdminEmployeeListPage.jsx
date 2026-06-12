import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useGetAllEmployeesQuery } from "../../services/employeeApi";
import {
  useChangeUserStatusMutation,
  useDeleteUserMutation,
} from "../../services/userApi";
import { HiOutlineCog6Tooth, HiOutlineMagnifyingGlass, HiOutlinePlusCircle, HiOutlineXMark } from "react-icons/hi2";
import PageHeader from "../../components/PageHeader";
import Table from "../../components/Table";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import EmployeeModal from "../../components/EmployeeModal";
import ConfirmModal from "../../components/ConfirmModal";
import { getEmployeeColumns } from "../../utils/adminEmployeeListHelper";
import { useSocketEvents } from "../../hooks/useSocketEvents";
import useDebounce from "../../hooks/useDebounce";
import CustomDropdown from "../../components/CustomDropdown";
import { useDeleteDepartmentMutation, useDeleteDesignationMutation, useGetDepartmentsQuery, useGetDesignationsQuery } from "../../services/settingsApi";
import { getDepartmentColumns, getDesignationColumns } from "../../utils/adminSettingsHelper";
import DepartmentModal from "../../components/DepartmentModal";
import DesignationModal from "../../components/DesignationModal";

const addOptionsByTab = {
  Employee: [
    {
      label: "ADD EMPLOYEE",
      role: "Employee",
    },
    {
      label: "ADD GAD EMPLOYEE",
      role: "GAD Employee",
    },
    {
      label: "ADD Hr EMPLOYEE",
      role: "Hr Employee",
    },
  ],

  Manager: [
    {
      label: "ADD MANAGER",
      role: "Manager",
    },
    {
      label: "ADD GAD MANAGER",
      role: "GAD Manager",
    },
    {
      label: "ADD Hr MANAGER",
      role: "Hr Manager",
    },
  ],

  Admin: [
    {
      label: "Add Admin",
      role: "Admin",
    }
  ],
};

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(
    location.state?.searchTerm || ""
  );
  const [statusFilter, setStatusFilter] = useState(
    location.state?.statusFilter || "All"
  );
  const [currentPage, setCurrentPage] = useState(
    location.state?.page || 1
  );
  const [limit, setLimit] = useState(
    location.state?.limit || 5
  );
  const [activeRole, setActiveRole] = useState(
    location.state?.activeRole || "Employee"
  );
  const [typeFilter, setTypeFilter] = useState(
    location.state?.typeFilter || "All"
  );
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    type: null,
  });
  const [settingsTab, setSettingsTab] = useState("Department");
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [designationModalOpen, setDesignationModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDesignation, setSelectedDesignation] = useState(null);
  const [selectedRole, setSelectedRole] = useState("Employee");

  const debouncedSearch = useDebounce(
    searchTerm.length > 1 ? searchTerm : "",
    400,
  );
  const { data, isLoading, isFetching, refetch } = useGetAllEmployeesQuery({
    page: currentPage,
    limit: limit,
    role: activeRole,
    type: typeFilter,
    status: statusFilter === "All" ? undefined : statusFilter,
    search: debouncedSearch,
  }, {
    skip: activeRole === "Settings",
    refetchOnMountOrArgChange: true,
  });
  const [changeUserStatus, { isLoading: isUpdatingStatus }] =
    useChangeUserStatusMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  useSocketEvents({
    onEmployeeChange: refetch,
  });

  const { data: departments = [] } =
    useGetDepartmentsQuery(undefined, {
      skip: activeRole !== "Settings" || settingsTab !== "Department",
      refetchOnMountOrArgChange: true,
    });
  const { data: designations = [] } =
    useGetDesignationsQuery(undefined, {
      skip: activeRole !== "Settings" || settingsTab !== "Designation",
      refetchOnMountOrArgChange: true,
    });
  const [deleteDepartment] = useDeleteDepartmentMutation();
  const [deleteDesignation] = useDeleteDesignationMutation();

  const closeConfirmModal = () => {
    setConfirmConfig({ isOpen: false, type: null });
  };

  const handleExecuteConfirm = async () => {
    if (!selectedEmp) return;

    const isDelete = confirmConfig.type === "delete";
    const loadingMessage = isDelete
      ? "Deleting records..."
      : "Updating access...";
    const t = toast.loading(loadingMessage);

    try {
      if (isDelete) {
        // Handle Deletion
        await deleteUser(selectedEmp.user._id).unwrap();
        toast.success("Employee removed successfully", { id: t });
      } else {
        // Handle Status Toggle
        const currentStatus = selectedEmp.user?.status;
        const newStatus = currentStatus === "Enable" ? "Disable" : "Enable";
        await changeUserStatus({
          id: selectedEmp.user._id,
          status: newStatus,
        }).unwrap();
        toast.success(
          `Access ${newStatus === "Enable" ? "enabled" : "disabled"}`,
          { id: t },
        );
      }
      closeConfirmModal();
      setSelectedEmp(null);
    } catch (err) {
      toast.error(err?.data?.message || "Operation failed", { id: t });
    }
  };

  // --- TABLE COLUMNS CONFIG ---
  const columns = useMemo(
    () =>
      getEmployeeColumns({
        role: activeRole,
        onEdit: (emp) => {
          setSelectedEmp(emp);
          setIsEmployeeModalOpen(true);
        },
        onDelete: (emp) => {
          setSelectedEmp(emp);
          setConfirmConfig({
            isOpen: true,
            type: "delete",
          });
        },
        onToggle: (emp) => {
          setSelectedEmp(emp);
          setConfirmConfig({
            isOpen: true,
            type: "toggle",
          });
        },
      }),
    [activeRole],
  );

  const departmentColumns = useMemo(
    () =>
      getDepartmentColumns({
        onEdit: (dept) => {
          setSelectedDepartment(dept);
          setDepartmentModalOpen(true);
        },
        onDelete: (dept) => {
          setSelectedDepartment(dept);
          handleDeleteDepartment(dept);
        },
      }),
    []
  );

  const designationColumns = useMemo(
    () =>
      getDesignationColumns({
        onEdit: (designation) => {
          setSelectedDesignation(designation);
          setDesignationModalOpen(true);
        },
        onDelete: (designation) => {
          setSelectedDesignation(designation);
          handleDeleteDesignation(designation);
        },
      }),
    []
  );

  const handleDeleteDepartment = async (dept) => {
    if (!window.confirm(`Delete ${dept.name}?`)) return;

    try {
      await deleteDepartment(dept._id).unwrap();
      toast.success("Department deleted");
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed");
    }
  };

  const handleDeleteDesignation = async (designation) => {
    if (!window.confirm(`Delete ${designation.name}?`)) return;

    try {
      await deleteDesignation(designation._id).unwrap();
      toast.success("Designation deleted");
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed");
    }
  };

  const handleAddUser = (role) => {
    setSelectedEmp(null);
    setSelectedRole(role); // new state
    setIsEmployeeModalOpen(true);
  };
  if (isLoading) return <Loader message="Accessing Workforce Database..." />;

  return (
    <div className="max-w-[1750px] mx-auto min-h-[83vh] bg-slate-100">
      <PageHeader
        title={`${activeRole} Management`}
        subtitle="Manage workforce access and profiles."
        iconText="E"
        tabs={[
          { id: "Employee", label: "Employees" },
          { id: "Manager", label: "Managers" },
          { id: "Admin", label: "Admin" },
        ]}
        activeTab={activeRole}
        onTabChange={(role) => {
          setActiveRole(role);
          setTypeFilter("All");
          setStatusFilter("All");
          setSearchTerm("");
          setCurrentPage(1);
        }}
        actionLabel={
          activeRole === "Settings" && (`Add ${settingsTab}`)
        }

        onAction={() => {
          if (activeRole === "Settings") {
            if (settingsTab === "Department") {
              setDepartmentModalOpen(true);
            } else {
              setDesignationModalOpen(true);
            }
            return;
          }

        }}

      />

      <main className="max-w-[1750px] mx-auto px-8 pb-10 -mt-10">
        {/* SEARCH & FILTER BAR */}
        {activeRole !== "Settings" && (
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 mb-8 flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 w-full group">
                <HiOutlineMagnifyingGlass
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none font-bold text-xs transition-all shadow-sm group"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <CustomDropdown
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "All", label: "All Status" },
                  { value: "Active", label: "Active" },
                  { value: "Disabled", label: "Disabled" },
                ]}
                placeholder="Filter by Status"
                buttonClass="py-3.5 px-4 bg-slate-100/80 rounded-xl border border-slate-200/50 shadow-sm text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-slate-500 hover:text-slate-800 min-w-[120px]"
              />

              {activeRole !== "Admin" && (
                <CustomDropdown
                  value={typeFilter}
                  onChange={(val) => {
                    setTypeFilter(val);
                    setCurrentPage(1);
                  }}
                  options={
                    activeRole === "Employee"
                      ? [
                        { value: "All", label: "All Types" },
                        { value: "Employee", label: "Employee" },
                        { value: "Hr Employee", label: "Hr Employee" },
                        { value: "GAD Employee", label: "GAD Employee" }
                      ]
                      : [
                        { value: "All", label: "All Types" },
                        { value: "Manager", label: "Manager" },
                        { value: "Hr Manager", label: "Hr Manager" },
                        { value: "GAD Manager", label: "GAD Manager" }
                      ]
                  }
                  buttonClass="py-3.5 px-4 bg-slate-100/80 rounded-xl border border-slate-200/50 shadow-sm text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-slate-500 hover:text-slate-800 min-w-[120px]"
                />
              )}

              {(
                searchTerm ||
                statusFilter !== "All" ||
                (activeRole !== "Admin" && typeFilter !== "All")
              ) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("All");
                      setTypeFilter("All");
                      setCurrentPage(1);
                    }}
                    className="flex items-center gap-2 px-6 py-3.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all font-bold text-xs cursor-pointer"
                  >
                    <HiOutlineXMark size={18} strokeWidth={2.5} />
                    <span>CLEAR FILTERS</span>
                  </button>
                )}

              <div className="flex gap-2">
                {addOptionsByTab[activeRole]?.map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleAddUser(item.role)}
                    className="flex items-center gap-2 mx-1.5 px-3.5 py-3.5 bg-slate-50 border border-slate-100 text-[10px] font-black hover:bg-orange-600 hover:text-white rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-orange-200 cursor-pointer"
                  >
                    <HiOutlinePlusCircle size={18} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActiveRole("Settings")}
                title="Go to Settings"
                className="px-4 py-3.75 bg-slate-900 text-white rounded-2xl hover:bg-orange-600 transition-all cursor-pointer shadow-lg shadow-slate-200"
              >
                <HiOutlineCog6Tooth size={18} />
              </button>
            </div>
          </div>
        )}

        {/* DATA TABLE CONTAINER */}
        {activeRole === "Settings" ? (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
            <div className="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm mb-3">
              {["Department", "Designation"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSettingsTab(tab)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${settingsTab === tab
                    ? "bg-orange-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {settingsTab === "Department" ? (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-visible flex flex-col group/table">
                <div className="rounded-t-[2rem] overflow-hidden">
                  <Table
                    columns={departmentColumns}
                    data={departments}
                    emptyMessage="No departments found."
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-visible flex flex-col group/table">
                <div className="rounded-t-[2rem] overflow-hidden">
                  <Table
                    columns={designationColumns}
                    data={designations}
                    emptyMessage="No designations found."
                  />
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-visible flex flex-col group/table">
            <div className="rounded-t-[2rem] overflow-hidden">
              <Table
                columns={columns}
                data={data?.employees || []}
                onRowClick={(emp) =>
                  navigate(`/employees/${emp.user?._id}`, {
                    state: {
                      page: currentPage,
                      limit,
                      searchTerm,
                      statusFilter,
                      activeRole,
                      typeFilter,
                    },
                  })
                }
                emptyMessage={`No ${activeRole.toLowerCase()}s found.`}
              />
            </div>

            {/* PAGINATION FOOTER */}
            <div className="bg-slate-50/50 p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 rounded-b-[2rem]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-3">
                    Page Limit
                  </span>

                  <CustomDropdown
                    value={limit.toString()}
                    onChange={(val) => {
                      setLimit(Number(val));
                      setCurrentPage(1);
                    }}
                    options={[5, 10, 25, 50].map((v) => ({
                      label: `${v}`,
                      value: v.toString(),
                    }))}
                    className="w-10"
                    buttonClass="w-full p-1 bg-transparent text-[9px] font-black cursor-pointer text-slate-700 flex items-center gap-2"
                  />
                </div>
                {data?.totalEmployees && (
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight ml-2">
                    Total {data?.totalEmployees} {activeRole}s
                  </span>
                )}
              </div>

              <Pagination
                pagination={{
                  current: data?.currentPage,
                  total: data?.totalPages,
                  count: data?.totalEmployees,
                  limit: limit,
                }}
                onPageChange={setCurrentPage}
                loading={isFetching}
                label="Employees"
              />
            </div>
          </div>
        )}

      </main>

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        editData={selectedEmp}
        role={selectedRole || activeRole}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={closeConfirmModal}
        onConfirm={handleExecuteConfirm}
        isLoading={isUpdatingStatus || isDeleting}
        title={
          confirmConfig.type === "delete" ? "Delete Employee" : "Update Access"
        }
        message={
          confirmConfig.type === "delete"
            ? `You are about to permanently delete ${selectedEmp?.user?.name}. This action cannot be undone.`
            : `Are you sure you want to change the access status for ${selectedEmp?.user?.name}?`
        }
        confirmText={
          confirmConfig.type === "delete"
            ? "Confirm"
            : selectedEmp?.user?.status === "Enable"
              ? "Disable"
              : "Enable"
        }
        variant={
          confirmConfig.type === "delete"
            ? "danger"
            : selectedEmp?.user?.status === "Enable"
              ? "danger"
              : "success"
        }
      />

      <DepartmentModal
        isOpen={departmentModalOpen}
        onClose={() => {
          setDepartmentModalOpen(false);
          setSelectedDepartment(null);
        }}
        editData={selectedDepartment}
      />

      <DesignationModal
        isOpen={designationModalOpen}
        onClose={() => {
          setDesignationModalOpen(false);
          setSelectedDesignation(null);
        }}
        editData={selectedDesignation}
      />
    </div>
  );
}
