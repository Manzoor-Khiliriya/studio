const User = require("../models/User");
const Employee = require("../models/Employee");
const { hashPassword } = require("./authHelpers");

async function initializeAdmin() {
  const exists = await User.exists({ role: "Admin" });

  if (exists) {
    console.log("✅ Admin already exists");
    return;
  }

  const user = await User.create({
    name: process.env.ADMIN_NAME,
    email: process.env.ADMIN_EMAIL?.toLowerCase(),
    password: await hashPassword(process.env.ADMIN_PASSWORD),
    plainPassword: process.env.ADMIN_PASSWORD,
    role: "Admin",
    status: "Enable",
  });

  await Employee.create({
    user: user._id,
    mobileNumber: "",
    dateOfBirth: null,
    departments: [],
    proficiency: 100,
  });

  console.log("✅ First admin created");
}

module.exports = initializeAdmin;