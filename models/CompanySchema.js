const mongoose = require("mongoose");
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: Number, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  status :{type : String  , default :"unverified" , enum : ["verified" ,"unverified"]},
  services: [{ type: String, required: true }],
  links: [{ type: String, required: true }],
  listjobs: [{ type: mongoose.Types.ObjectId, ref: "Jobs" }],
});

const Collection = mongoose.model("Company", CompanySchema);
module.exports = Collection;
