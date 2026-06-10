exports.buildApprovalFlow = (role, managerId, adminIds) => {
  switch (role) {
    case "Employee":
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
          status: "Waiting",
        },
      ];

    case "GAD Employee":
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
          status: "Waiting",
        },
      ];

    case "Hr Employee":
      return [
        { role: "Hr Manager", status: "Pending" },
        { role: "Admin", approvers: adminIds, status: "Waiting" },
      ];

    case "Hr Manager":
      return [
        { role: "Admin", approvers: adminIds, status: "Pending" },
        { role: "Hr Manager", status: "Waiting" },
      ];

    default:
      return [];
  }
};
