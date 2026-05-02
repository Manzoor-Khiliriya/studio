import React from "react";
import {
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineInformationCircle
} from "react-icons/hi2";
import { CgSpinner } from "react-icons/cg";
import CommonModal, { InputGroup } from "./CommonModal";

export default function HolidayModal({
  isOpen,
  onClose,
  holidayModel,
  setHolidayModel,
  onSubmit,
  isSaving,
}) {
  const isEditing = !!holidayModel.id;

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Update Holiday" : "Register Holiday"}
      maxWidth="max-w-md"
      onSubmit={onSubmit}
      isLoading={isSaving}
      submitText={isEditing ? "Update" : "Create"}
    >
      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-6"
      >
        {/* HOLIDAY NAME */}
        <InputGroup label="Holiday Name *">
          <HiOutlineSparkles className="input-icon" />
          <input
            required
            type="text"
            placeholder="Enter Holiday Name"
            value={holidayModel.name}
            onChange={(e) =>
              setHolidayModel({ ...holidayModel, name: e.target.value })
            }
            className="form-input"
          />
        </InputGroup>

        {/* DATE SELECT */}
        <InputGroup label="Holiday Date *">
          <HiOutlineCalendar className="input-icon" />
          <input
            required
            type="date"
            value={holidayModel.date}
            onChange={(e) =>
              setHolidayModel({ ...holidayModel, date: e.target.value })
            }
            className="form-input tabular-nums"
          />
        </InputGroup>

        {/* DESCRIPTION */}
        <InputGroup label="Description">
          <HiOutlineInformationCircle className="input-icon !top-6.5 translate-y-0" />
          <textarea
            placeholder="Enter Holiday Description..."
            value={holidayModel.description}
            onChange={(e) =>
              setHolidayModel({
                ...holidayModel,
                description: e.target.value,
              })
            }
            rows={3}
            className="form-input !py-3 min-h-[100px] resize-none leading-relaxed"
          />
        </InputGroup>
      </form>
    </CommonModal>
  );
}