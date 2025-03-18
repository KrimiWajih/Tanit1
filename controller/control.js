const Users = require("../models/UserSchema");
const Jobs = require("../models/JobsSchema");
const Company = require("../models/CompanySchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

exports.verifyEmailU = async (req, res) => {
  const { token } = req.params;
  const secretkey = "abc123";
  try {
    const decodedToken = jwt.verify(token, secretkey);
    const user = await Users.findById(decodedToken.id);
    if (!user) {
      return res.status(404).send({ Msg: "User not found" });
    }
    if (user.status === "verified") {
      return res.status(400).send({ Msg: "Account already verified" });
    }
    user.status = "verified";
    await user.save();
    res.status(200).send({ Msg: "Account verified successfully!" });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(400).send({ Msg: "Invalid or expired token" });
    }
    res.status(500).send({ Msg: "Failed to verify account", error });
  }
};
exports.verifyEmailC = async (req, res) => {
  const { token } = req.params;
  const secretkey = "abc123";
  try {
    const decodedToken = jwt.verify(token, secretkey);
    const user = await Company.findById(decodedToken.id);
    if (!user) {
      return res.status(404).send({ Msg: "Company not found" });
    }
    if (user.status === "verified") {
      return res.status(400).send({ Msg: "Account already verified" });
    }
    user.status = "verified";
    await user.save();
    res.status(200).send({ Msg: "Account verified successfully!" });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(400).send({ Msg: "Invalid or expired token" });
    }
    res.status(500).send({ Msg: "Failed to verify account", error });
  }
};

exports.signupuser = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    address,
    skills,
    experience,
    education,
    certificates,
    applications,
  } = req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "wajihkurousagi@gmail.com",
      pass: "vagm seay dcmo ltnz",
    },
  });

  try {
    const testuser = await Users.findOne({ email });
    if (testuser) {
      return res.status(400).send({ Msg: "User already exists" });
    } else {
      const salt = 10;
      const hpassword = bcrypt.hashSync(password, salt);
      const newuser = new Users({
        name,
        email,
        password: hpassword,
        address,
        phone,
        skills,
        experience,
        education,
        certificates,
        applications,
      });
      const secretkey = "abc123";
      const token = jwt.sign(
        {
          id: newuser._id,
          email: newuser.email,
        },
        secretkey,
        { expiresIn: "7d" }
      );

      const mailoptions = {
        to: email,
        subject: "Please Verify Your Account",
        html: `
          <h1>Welcome to our website</h1>
          <p>Please verify your account by clicking the link below:</p>
          <a href="http://localhost:3000/verifyaccount/${token}">Verify Account</a>
        `,
      };
      try {
        await transporter.sendMail(mailoptions);
        await newuser.save();
        res.status(201).send({
          Msg: "User registered successfully. Please check your email for verification.",
        });
      } catch (error) {
        return res
          .status(500)
          .send({ Msg: "Failed to send verification email", error });
      }
    }
  } catch (error) {}
};

exports.signupcompany = async (req, res) => {
  const { name, email, password, phone, address, services, links, listjobs } =
    req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "wajihkurousagi@gmail.com",
      pass: "vagm seay dcmo ltnz",
    },
  });

  try {
    const testuser = await Company.findOne({ email });
    if (testuser) {
      return res.status(400).send({ Msg: "User already exists" });
    } else {
      const salt = 10;
      const hpassword = bcrypt.hashSync(password, salt);
      const newuser = new Company({
        name,
        email,
        password: hpassword,
        address,
        phone,
        services,
        links,
        listjobs,
      });
      const secretkey = "abc123";
      const token = jwt.sign(
        {
          id: newuser._id,
          email: newuser.email,
        },
        secretkey,
        { expiresIn: "7d" }
      );

      const mailoptions = {
        to: email,
        subject: "Please Verify Your Account",
        html: `
          <h1>Welcome to our website</h1>
          <p>Please verify your account by clicking the link below:</p>
          <a href="http://localhost:3000/verifyaccountC/${token}">Verify Account</a>
        `,
      };
      try {
        await transporter.sendMail(mailoptions);
        await newuser.save();
        res.status(201).send({
          Msg: "User registered successfully. Please check your email for verification.",
        });
      } catch (error) {
        return res
          .status(500)
          .send({ Msg: "Failed to send verification email", error });
      }
    }
  } catch (error) {}
};

exports.signinuser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const UserFound = await Users.findOne({ email });
    if (!UserFound) {
      res.status(400).send({ Msg: "User not found" });
    } else {
      const match = bcrypt.compareSync(password, UserFound.password);
      if (!match) {
        res.status(500).send({ Msg: "Wrong Password" });
      } else {
        const secretkey = "abc123";
        const token = jwt.sign(
          { id: UserFound._id, name: UserFound.name },
          secretkey,
          {
            expiresIn: "1d",
          }
        );
        res.cookie("token",token,{httpOnly : true , maxAge : 60*60*24*7*1000}) 
        res
          .status(200)
          .send({ Msg: "Login Successful", User: UserFound, token });
      }
    }
  } catch (error) {
    res.status(500).send({ Msg: "Failed to login" });
  }
};


exports.logout = (req,res)=>{
  res.clearCookie("token" , {httpOnly : true ,secure: true});
 return  res.status(200).send({Msg :"Logged out"})

}

exports.signincompany = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userFound = await Company.findOne({ email });
    if (!userFound) {
      res.status(400).send({ Msg: "User not found" });
    } else {
      const match = bcrypt.compareSync(password, userFound.password);
      if (!match) {
        res.status(500).send({ Msg: "Wrong Password" });
      } else {
        const secretkey = "abc123";
        const token = jwt.sign(
          { id: userFound._id, name: userFound.name },
          secretkey,
          {
            expiresIn: "1d",
          }
        );
        res.cookie("token",token,{httpOnly : true , maxAge : 60*60*24*7*1000}) 
        res
          .status(200)
          .send({ Msg: "Login Successful", User: userFound, token });
      }
    }
  } catch (error) {
    res.status(500).send({ Msg: "Failed to login" });
  }
};

exports.updateOneUser = async (req, res) => {
  const { oldpassword, newpassword, name, email } = req.body;
  try {
    const tokenuser = req.user._id;

    const UserFound = await Users.findById(tokenuser);
    if (UserFound == null) {
      res.status(400).send({ Msg: "User not found" });
    } else {
      if (oldpassword && newpassword) {
        const salt = 10;
        const match = bcrypt.compareSync(oldpassword, UserFound.password);
        if (match) {
          const hpassword = bcrypt.hashSync(newpassword, salt);
          const Updatedinfo = await Users.findByIdAndUpdate(
            tokenuser,
            { ...req.body, password: hpassword },
            { new: true }
          );
          await UserFound.save();

          res.status(200).send({ msg: "user updated" });
        } else {
          res.status(400).send({ msg: "wrong password" });
        }
      } else {
        const Updatedinfo = await Users.findByIdAndUpdate(
          tokenuser,
          { ...req.body },
          { new: true }
        );
        await UserFound.save();
        res.status(200).send({ msg: "user updated" });
      }
    }
  } catch (error) {
    res.status(500).send({ Msg: "Failed to Update", error });
  }
};

exports.updateOneCompany = async (req, res) => {
  const { oldpassword, newpassword } = req.body;
  try {
    const tokenuser = req.user._id;

    const UserFound = await Company.findById(tokenuser);
    if (UserFound == null) {
      res.status(400).send({ Msg: "User not found" });
    } else {
      if (oldpassword && newpassword) {
        const salt = 10;
        const match = bcrypt.compareSync(oldpassword, UserFound.password);
        if (match) {
          const hpassword = bcrypt.hashSync(newpassword, salt);
          const Updatedinfo = await Company.findByIdAndUpdate(
            tokenuser,
            { ...req.body, password: hpassword },
            { new: true }
          );
          await UserFound.save();

          res.status(200).send({ msg: "user updated" });
        } else {
          res.status(400).send({ msg: "wrong password" });
        }
      } else {
        const Updatedinfo = await Company.findByIdAndUpdate(
          tokenuser,
          { ...req.body },
          { new: true }
        );
        await UserFound.save();
        res.status(200).send({ msg: "user updated", NewUser: Updatedinfo });
      }
    }
  } catch (error) {
    res.status(500).send({ Msg: "Failed to Update", error });
  }
};

exports.addjob = async (req, res) => {
  try {
    const compid = req.user._id;
    const CompanyFound = await Company.findById(compid);
    if (!CompanyFound) {
      return res
        .status(400)
        .send({ Msg: "You are not authorized to post a job" });
    } else {
      const newJob = new Jobs({ ...req.body, companyid: compid });
      await newJob.save();
      const newjobid = newJob._id;
      CompanyFound.listjobs.push(newjobid._id);
      await CompanyFound.save();
      res.status(201).send({ Msg: "Job posted Successfully" });
    }
  } catch (error) {
    res.status(500).send({ Msg: "Failed to post the job ", error });
  }
};

exports.deletejobC = async (req, res) => {
  try {
    const tokenC = req.user._id;
    const CompanyFound = await Company.findById(tokenC);
    if (!CompanyFound) {
      return res.status(400).send({ Msg: "Company Not Found" });
    } else {
      if (!CompanyFound.listjobs.includes(req.body.jobid)) {
        return res.status(400).send({
          Msg: " Job Not Found ",
        });
      } else {
        const jobFound = await Jobs.findById(req.body.jobid);
        if (
          jobFound &&
          jobFound.companyid.toString() === CompanyFound._id.toString()
        ) {
          CompanyFound.listjobs = CompanyFound.listjobs.filter(
            (jobId) => jobId.toString() !== req.body.jobid.toString()
          );
          await CompanyFound.save();
          for (let i = 0; i < jobFound.listusers.length; i++) {
            const user = await Users.findById(jobFound.listusers[i]._id);
            if (user) {
              user.applications = user.applications.filter(
                (jobId) => jobId.toString() !== req.body.jobid.toString()
              );
              await user.save();
            }
          }
          const jobDeleted = await Jobs.findByIdAndDelete(req.body.jobid);
          return res.status(200).send({
            Msg: "Job deleted successfully",
            deleted: jobDeleted,
          });
        } else {
          return res.status(500).send({ Msg: "Job not found" });
        }
      }
    }
  } catch (error) {
    res.status(500).send({ Msg: "Error deleting", error });
  }
};

exports.deletejobU = async (req, res) => {
  try {
    const tokenU = req.user._id;
    const UserFound = await Users.findById(tokenU);
    if (!UserFound) {
      return res.status(400).send({ Msg: "User Not Found" });
    } else {
      UserFound.applications = UserFound.applications.filter(
        (jobid) => jobid.toString() !== req.body.jobid.toString()
      );
      await UserFound.save();
      const JobFound = await Jobs.findById(req.body.jobid)
      if (!JobFound) {
        return res.status(400).send({ Msg: "Job Not Found" });
      }
      JobFound.listusers = JobFound.listusers.filter((userid) => userid.toString() !== tokenU.toString())
      await JobFound.save();
      res.status(200).send({ Msg: " Job Deleted Successfully" });
    }
  } catch (error) {
    res.status(500).send({ Msg: " Failed", error });
  }
};

exports.updatejobC = async (req, res) => {
  try {
    const tokenC = req.user._id;
    if (!tokenC) {
      return res
        .status(400)
        .send({ Msg: "You are not authorized to update the job" });
    } else {
      const jobid = req.body.jobid;
      const JobFound = await Jobs.findById(jobid);
      if (!JobFound) {
        return res.status(400).send({ Msg: "Job not Found" });
      } else {
        if (JobFound.companyid.toString() !== tokenC.toString()) {
          return res
            .status(500)
            .send({ Msg: "You are not authorized to update the job " });
        } else {
          const UpdatedJob = await Jobs.findByIdAndUpdate(
            jobid,
            { ...req.body },
            { new: true }
          );
        }
      }
      res.status(200).send({ Msg: "Job Updated Successfully" });
    }
  } catch (error) {
    res.status(500).send({ Msg: "Failed to Update Job", error });
  }
};

exports.applytojob = async (req, res) => {
  try {
    const tokenU = req.user._id;
    const JobFound = await Jobs.findById(req.body.jobid);
    if (JobFound.listusers.includes(tokenU)) {
      return res.status(400).send({ Msg: " Already Applied" });
    } else {
      JobFound.listusers.push(tokenU);
      await JobFound.save();
      const User = await Users.findById(tokenU);
      console.log(User);
      User.applications.push(req.body.jobid);
      await User.save();
      res.status(200).send({ Msg: "Applied to job successfully" });
    }
  } catch (error) {
    res.status(500).send({ Msg: "Failed to Apply" });
  }
};

exports.getuserdata = async (req, res) => {
  const userid = req.body.userid ;
  try {
    const UserFound = await Users.findById(userid).select("-_id -password")
    if(!UserFound){
      return res.status(500).send({Msg : " User Not Found "})
    }else{
      await UserFound.populate("applications" , "-_id")
      return res.status(200).send({Msg : "User Data" , User : UserFound })
    }
  } catch (error) {
    res.status(500).send({Msg : "Failed to get Data"})
  }
};

exports.getcompanydata = async (req, res) => {
  const companyid = req.body.companyid ;
  try {
    const CompanyFound = await Company.findById(companyid).select("-_id -password")
    if(!CompanyFound){
      return res.status(500).send({Msg : " Company Not Found "})
    }else{
      await CompanyFound.populate("listjobs" , "-_id -companyid")
      await CompanyFound.populate("listjobs.listusers" , "-_id -password -role -status")
      return res.status(200).send({Msg : "Company Data" , Company : CompanyFound})
    }
  } catch (error) {
    res.status(500).send({Msg : "Failed to get Data "})
  }
  
};

exports.getjobdata = async (req, res) => {
  const jobid = req.body.jobid ;
  try {
    const JobFound = await Jobs.findById(jobid).select("-_id -listusers").populate("companyid" ," -_id -password")
    if(!JobFound){
      return res.status(500).send({Msg : " Job Not Found "})
    }else{
    
      return res.status(200).send({Msg : "Job Data" , Job : JobFound })
    }
  } catch (error) {
    res.status(500).send({Msg : "Failed to get Data "})
  }
};

exports.getCurrent = async (req,res)=>{
 try {
  const user = req.user 
  res.status(200).send({Msg : "Connecting User" , User : user})
 } catch (error) {
  res.status(200).send({Msg : "Connect"})
 } 
}