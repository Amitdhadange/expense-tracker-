const mongoose = require("mongoose");

const expensesModel= new mongoose.Schema({
    amount: Number,
    remark: String,
    category: String,
    paymentmode: {
        type: Number,
        enum: ["cash","online","check"],
    },
    user:{type :mongoose.Schema.Types.ObjectId,ref :"my"}
},{ timestamp: true }
);
module.exports = mongoose.model("expense", expensesModel);