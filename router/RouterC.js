const express = require("express");
const {
  signupuser,
  verifyEmailU,
  updateOneUser,
  signupcompany,
  signinuser,
  signincompany,
  addjob,
  verifyEmailC,
  updateOneCompany,
  deletejobC,
  deletejobU,
  updatejobC,
  applytojob,
  getuserdata,
  getcompanydata,
  getjobdata,
  getCurrent,
  logout,
} = require("../controller/control");
const { signupvalidation, validation } = require("../middleware/verif");
const { isauth } = require("../middleware/isAuth");
const { isauthC } = require("../middleware/isAuthC");
const Users = require("../models/UserSchema");
const Jobs = require("../models/JobsSchema");
const Company = require("../models/CompanySchema");
const CRouter = express.Router();

// User routes
CRouter.post("/signupuser", signupvalidation, validation, signupuser);
CRouter.post("/signin", signupvalidation, validation, signinuser);
CRouter.put("/updateuser", isauth, updateOneUser);
CRouter.get("/verifyU/:token", verifyEmailU);
CRouter.delete("/deletejobu", isauth, deletejobU);
CRouter.post("/applytojob", isauth, applytojob);
CRouter.get("/getcurrentU", isauth, getCurrent);

// Public routes
CRouter.get("/userdata", getuserdata);
CRouter.get("/companydata", getcompanydata);
CRouter.get("/jobdata", getjobdata);

// Company routes
CRouter.post("/signupcompany", signupvalidation, validation, signupcompany);
CRouter.post("/signincompany", signupvalidation, validation, signincompany);
CRouter.put("/updatecompany", isauthC, updateOneCompany);
CRouter.get("/verifyC/:token", verifyEmailC);
CRouter.delete("/deletejob", isauthC, deletejobC);
CRouter.put("/updatejobc", isauthC, updatejobC);
CRouter.get("/getcurrentC", isauthC, getCurrent);
CRouter.post("/addjob", isauthC, addjob);

CRouter.post("/logout",logout);

CRouter.post("/searchjobs", async (req, res) => {
  try {
    const { title, location, skills } = req.body;

    const query = {};
    if (title) query.title = { $regex: title, $options: "i" }; 
    if (location) query.location = { $regex: location, $options: "i" }; 
    if (skills && skills.length > 0) query.requirements = { $in: skills };

    const jobs = await Jobs.find(query).populate("companyid", "name address");

    if (jobs.length === 0) {
      return res.status(404).json({ message: "No jobs found matching the criteria." });
    }

    res.json({ jobs });
  } catch (error) {
    console.error("Error searching jobs:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = CRouter;
