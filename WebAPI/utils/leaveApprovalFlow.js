exports.buildApprovalFlow = (role, managerId, adminIds, hrId) => {
  switch (role) {
    case "Employee":
      if (managerId) {
        return [
          {
            role: "Manager",
            approver: managerId,
            status: "Pending",
          },
          {
            role: "Admin",
            approvers: adminIds,
            status: "Waiting",
          },
          {
            role: "Hr Manager",
            approver: hrId,
            status: "Waiting",
          },
        ];
      }

      return [
        {
          role: "Admin",
          approvers: adminIds,
          status: "Pending",
        },
        {
          role: "Hr Manager",
          approver: hrId,
          status: "Waiting",
        },
      ];

    case "Manager":
    case "GAD Manager":
      return [
        {
          role: "Admin",
          approvers: adminIds,
          status: "Pending",
        },
        {
          role: "Hr Manager",
          approver: hrId,
          status: "Waiting",
        },
      ];

    case "GAD Employee":
      if (managerId) {
        return [
          {
            role: "GAD Manager",
            approver: managerId,
            status: "Pending",
          },
          {
            role: "Admin",
            approvers: adminIds,
            status: "Waiting",
          },
          {
            role: "Hr Manager",
            approver: hrId,
            status: "Waiting",
          },
        ];
      }

      return [
        {
          role: "Admin",
          approvers: adminIds,
          status: "Pending",
        },
        {
          role: "Hr Manager",
          approver: hrId,
          status: "Waiting",
        },
      ];

    case "Hr Employee":
      return [
        {
          role: "Hr Manager",
          approver: hrId,
          status: "Pending",
        },
        { role: "Admin", approvers: adminIds, status: "Waiting" },
      ];

    case "Hr Manager":
      return [{ role: "Admin", approvers: adminIds, status: "Pending" }];

    default:
      return [];
  }
};
