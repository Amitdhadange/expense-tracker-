const mongoose = require("mongoose");
const plm =require("passport-local-mongoose");

const data = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    otp: {
        type: Number,
        default: -1,
    },
    expenses:[{type:mongoose.Schema.Types.ObjectId,ref:"expense"}],
    
},{timestamps:true}
)
data.plugin(plm);
module.exports = mongoose.model("my", data);