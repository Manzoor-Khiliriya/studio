const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "Earned Leave",
        "Sick Leave",
        "Bereavement Leave",
        "Paternity Leave",
        "Maternity Leave",
        "Casual Leave",
        "Compensatory Off",
        "LOP",
      ],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    currentLevel: {
      type: Number,
      default: 0,
    },

    approvalFlow: [
      {
        role: {
          type: String,
          enum: ["Manager", "Admin", "Hr Manager", "GAD Manager"],
        },

        approver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        approvers: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        ],

        status: {
          type: String,
          enum: ["Waiting", "Pending", "Approved", "Rejected"],
          default: "Waiting",
        },

        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        approvedAt: Date,

        comment: {
          type: String,
          trim: true,
        },
      },
    ],

    // remark: {
    //   type: String,
    //   trim: true,
    // },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

leaveSchema.pre("validate", function () {
  if (this.endDate < this.startDate) {
    throw new Error("End date cannot be before start date");
  }
});

leaveSchema.virtual("currentApprover").get(function () {
  return this.approvalFlow?.[this.currentLevel] || null;
});

module.exports = mongoose.model("Leave", leaveSchema);
