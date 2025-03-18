const mongoose = require("mongoose");
const JobsSchema = new mongoose.Schema({
companyid : {type : mongoose.Types.ObjectId , ref : "Company"},
description :{type : String , required : true},
title : {type : String , required : true},
location :{type : String , required :true},
requirements :{type :String , required : true},
listusers  : [{type : mongoose.Types.ObjectId , ref : "Users"}]
})

const Collection = mongoose.model("Jobs", JobsSchema);
module.exports = Collection;