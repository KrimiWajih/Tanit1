const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
 name : {type : String , required:true},
 email : {type : String , required:true},
 phone :{type : Number , required : true},
 password :{type : String ,required : true},
 role :{type : String , default : "user"},
 status :{type : String  , default :"unverified" , enum : ["verified" ,"unverified"]},
 address : {type :String , required : true},
 skills : [{type : String , default :""}],
 experience : [{Company: {type : String , default :""} , duration : {type : String ,default :""}}],
 education :[{University: {type : String , default :""} , duration : {type : String ,default :""}}],
 certificates :[{type : String , default :"none"}],
 applications : [{type: mongoose.Types.ObjectId , ref : "Jobs"}]
})
const Collection = mongoose.model("Users", UserSchema);
module.exports = Collection;