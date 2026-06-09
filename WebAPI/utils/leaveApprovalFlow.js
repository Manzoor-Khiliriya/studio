exports.buildApprovalFlow = (role) => {
  switch (role) {
    case "Employee":
      return [
        { role: "Manager", status: "Pending" },
        { role: "Admin", status: "Waiting" },
        { role: "GAD Employee", status: "Waiting" },
      ];

    case "Manager":
      return [
        { role: "Admin", status: "Pending" },
        { role: "GAD Employee", status: "Waiting" },
      ];

    case "Admin":
      return [
        { role: "GAD Manager", status: "Pending" },
      ];

    case "GAD Employee":
      return [
        { role: "GAD Manager", status: "Pending" },
      ];

    default:
      return [];
  }
};