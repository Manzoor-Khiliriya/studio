exports.buildApprovalFlow =(role, managerId) => {
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
        { role: "Admin", status: "Waiting" },
      ];

    case "Hr Manager":
      return [
        { role: "Admin", status: "Pending" },
        { role: "Hr Manager", status: "Waiting" },
      ];

    default:
      return [];
  }
}
