import { isRejectedWithValue } from "@reduxjs/toolkit";
import toast from "react-hot-toast";

export const rtkErrorMiddleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const status = action.payload?.status;

    if (status === 429) {
      toast.error(
        action.payload?.data?.error ||
        action.payload?.data?.message ||
        "Too many requests. Please slow down and try again shortly."
      );
    }
  }

  return next(action);
};