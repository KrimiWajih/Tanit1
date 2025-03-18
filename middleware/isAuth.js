const jwt = require("jsonwebtoken");
const Users = require("../models/UserSchema")
const Company = require("../models/CompanySchema")
exports.isauth = async (req,res,next)=>{
try {
   const token = req.cookies.token
    const secretkey ="abc123";
    const verify = jwt.verify(token , secretkey);
   const user= await Users.findById(verify.id) || await Company.findById(verify.id)
    if(user){
            req.user =user;
            next();
        }else{

         res.status(400).send({ Msg: "Not authorized. Only admin can post a job" });
        }  
} catch (error) {
    res.status(400).send({ Msg: "failed to verify " ,error });
}
}