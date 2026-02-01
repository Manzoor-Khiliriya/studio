const Leave = require("../models/Leave");
const User = require("../models/User");
const { isActiveAdmin } = require("../utils/userHelpers");
const { calculateLeaveDays, hasLeaveOverlap } = require("../utils/leaveHelpers");

/* =============================================================
   EMPLOYEE CONTROLLERS
   ============================================================= */

/**
 * 👨‍💻 Get My Leave History & Calculated Stats
 * Includes Holiday-aware balance and business day counts
 */
exports.getMyLeaves = async (req, res) => {
    try {
        const leaves = await Leave.find({ user: req.user.id }).sort({ appliedAt: -1 });
        const user = await User.findById(req.user.id);

        // 1. Calculate Months Employed (Earned balance logic)
        const joinDate = new Date(user.createdAt);
        const today = new Date();
        const monthsEmployed = (today.getFullYear() - joinDate.getFullYear()) * 12 + 
                               (today.getMonth() - joinDate.getMonth());

        const totalEarned = parseFloat((monthsEmployed * (14 / 12)).toFixed(1));

        // 2. Calculate Taken (Async handling for Holidays)
        let taken = 0;
        const approvedAnnualLeaves = leaves.filter(l => l.status === "Approved" && l.type === "Annual Leave");
        
        for (const l of approvedAnnualLeaves) {
            taken += await calculateLeaveDays(l.startDate, l.endDate);
        }

        // 3. Enrich History (Promise.all handles async mapping for holidays/weekends)
        const history = await Promise.all(leaves.map(async (l) => {
            const businessDays = await calculateLeaveDays(l.startDate, l.endDate);
            return {
                ...l.toObject(),
                businessDays
            };
        }));

        res.json({
            history,
            stats: {
                earned: totalEarned,
                taken: taken,
                remaining: parseFloat((totalEarned - taken).toFixed(1))
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * 👨‍💻 Apply for Leave
 * Logic: Checks holiday-aware balance and prevents overlap
 */
exports.applyLeave = async (req, res) => {
    try {
        const { type, startDate, endDate, reason } = req.body;
        
        // 1. Calculate actual business days (skipping holidays & weekends)
        const requestedDays = await calculateLeaveDays(startDate, endDate);

        if (requestedDays === 0) {
            return res.status(400).json({ message: "Selected range consists only of weekends or holidays." });
        }

        // 2. Balance Check for Annual Leave
        if (type === "Annual Leave") {
            const user = await User.findById(req.user.id);
            const approvedLeaves = await Leave.find({ user: req.user.id, status: "Approved", type: "Annual Leave" });
            
            const joinDate = new Date(user.createdAt);
            const months = (new Date().getFullYear() - joinDate.getFullYear()) * 12 + (new Date().getMonth() - joinDate.getMonth());
            const earned = months * (14 / 12);
            
            let taken = 0;
            for (const l of approvedLeaves) {
                taken += await calculateLeaveDays(l.startDate, l.endDate);
            }
            
            if (requestedDays > (earned - taken)) {
                return res.status(400).json({ 
                    message: `Insufficient balance. Available: ${(earned - taken).toFixed(1)} days.` 
                });
            }
        }

        // 3. Overlap Check
        const existingLeaves = await Leave.find({ user: req.user.id, status: { $ne: "Rejected" } });
        if (hasLeaveOverlap(existingLeaves, startDate, endDate)) {
            return res.status(400).json({ message: "You already have a leave request overlapping these dates." });
        }

        const leave = await Leave.create({
            user: req.user.id,
            type,
            startDate,
            endDate,
            reason
        });

        res.status(201).json({ message: "Leave application submitted successfully", leave });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * 👨‍💻 Update Leave (Edit Data)
 * Logic: Must be Owner AND Status must be 'Pending'
 */
exports.updateLeave = async (req, res) => {
    try {
        const { type, startDate, endDate, reason } = req.body;
        const leave = await Leave.findById(req.params.id);

        if (!leave) return res.status(404).json({ message: "Leave request not found." });

        if (leave.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Unauthorized. This is not your request." });
        }

        if (leave.status !== "Pending") {
            return res.status(400).json({ message: `Cannot edit a ${leave.status.toLowerCase()} request.` });
        }

        // Update fields if provided
        if (type) leave.type = type;
        if (startDate) leave.startDate = startDate;
        if (endDate) leave.endDate = endDate;
        if (reason) leave.reason = reason;

        await leave.save();
        res.json({ message: "Leave request updated successfully.", leave });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * 👨‍💻 Cancel/Delete Leave Request
 * Logic: Admins delete anything. Employees only delete their own PENDING requests.
 */
exports.deleteLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ message: "Leave record not found." });

        const isAdmin = req.user.role === 'Admin';
        const isOwner = leave.user.toString() === req.user.id;

        if (!isAdmin) {
            if (!isOwner) return res.status(403).json({ message: "Unauthorized." });
            if (leave.status !== "Pending") {
                return res.status(400).json({ message: "Cannot delete a processed request." });
            }
        }

        await Leave.findByIdAndDelete(req.params.id);
        res.json({ message: "Leave request removed successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* =============================================================
   ADMIN CONTROLLERS
   ============================================================= */

/**
 * 🧑‍💼 Get All Leaves (Admin)
 * Filters by status/search and calculates individual employee balances
 */
exports.getAllLeaves = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};
        
        if (status && status !== "All") {
            query.status = status;
        }

        let leaves = await Leave.find(query)
            .populate("user", "name email createdAt")
            .sort({ appliedAt: -1 });

        // Search by user name
        if (search) {
            const term = search.toLowerCase();
            leaves = leaves.filter(leave => 
                leave.user?.name.toLowerCase().includes(term)
            );
        }

        // Enrich with business days and balance calculations
        const enrichedLeaves = await Promise.all(leaves.map(async (leave) => {
            const joinDate = new Date(leave.user.createdAt);
            const today = new Date();
            const months = (today.getFullYear() - joinDate.getFullYear()) * 12 + 
                           (today.getMonth() - joinDate.getMonth());
            
            const earned = parseFloat((months * (14 / 12)).toFixed(1));
            const businessDays = await calculateLeaveDays(leave.startDate, leave.endDate);
            
            return {
                ...leave.toObject(),
                businessDays,
                employeeBalance: earned
            };
        }));

        res.json(enrichedLeaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * 🧑‍💼 Process Leave (Approve/Reject)
 */
exports.processLeave = async (req, res) => {
    try {
        if (!isActiveAdmin(req.user)) return res.status(403).json({ message: "Admin access required" });

        const { status, adminComment } = req.body;
        const leave = await Leave.findById(req.params.id);

        if (!leave) return res.status(404).json({ message: "Leave request not found" });
        if (leave.status !== "Pending") {
            return res.status(400).json({ message: "This request has already been processed." });
        }

        leave.status = status; 
        leave.adminComment = adminComment;
        leave.processedBy = req.user.id;

        await leave.save();
        res.json({ message: `Leave request ${status.toLowerCase()} successfully`, leave });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};