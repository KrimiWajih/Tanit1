const jwt = require("jsonwebtoken");
const Company = require("../models/CompanySchema")
exports.isauthC = async (req,res,next)=>{

try {
  const token = req.cookies.token
    const secretkey ="abc123";
    const verify = jwt.verify(token , secretkey);
   const user= await Company.findById(verify.id);
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