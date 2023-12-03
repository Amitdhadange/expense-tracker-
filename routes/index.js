var express = require('express');
var router = express.Router();
const nodemailer =require ("nodemailer")
const User = require("../model/usermodel");
const passport = require("passport");
const LocalStrategy = require("passport-local");
passport.use(new LocalStrategy(User.authenticate()));
const Expense = require("../model/expensesModel")
const email = require("../emailhide")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index',{admin:req.user});
});

router.get('/signup', function(req, res, next) {

  res.render('signup',{admin:req.user});
});

router.post('/signup', async function(req, res, next) {
  try {
    await User.register(
      {username: req.body.username,email:req.body.email},req.body.password
    );
    res.redirect("login");
  } catch (error) {
    res.send(error);
  }
  res.render('signup');
});
// ----------------------------------------------------login-----------------------
router.get('/login', function(req, res, next) {
  res.render('login',{admin:req.user});
});

router.post("/login",passport.authenticate("local",{
    successRedirect:"/profilehome",
    failureRedirect:"/login",
  }),
    function (req,res,next) {}
);
// ----------------------------------------------profile-----------------------
router.get('/profile', isLoggedIn,async function(req, res, next) {
  try {
    res.render("profile",{admin:req.user});
  } catch (error) {
    res.send(error);
  }
});


router.get('/forgget', function(req, res, next) {
    res.render("forgget");
  
});

router.post('/sendmail', async function(req, res, next) {
  try {
    const user = await User.findOne({email:req.body.email});
    // console.log(user)
    if(!user) return res.send("User not found");
    sendmailhandler(req,res,user);
  } catch (error) {
    // console.log(error)
    res.send(error);
  }
});

function sendmailhandler(req, res, user) {
  // console.log(user)
  const otp = Math.floor(1000 + Math.random() * 9000);
  // console.log(otp)
  const transport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: email.gmail,
        pass: email.pass,
    },
});

// receiver mailing info
const mailOptions = {
    from: "amit Pvt. Ltd.<amitdhadange71@gmail.com>",
    to: user.email,
    subject: "Testing Mail Service",
    // text: req.body.message,
    html: `<h1>This is Free Mail Services  ${otp}</h1>`,
};

// actual object which intregrate all info and send mail
transport.sendMail(mailOptions, (err, info) => {
    if (err) return res.send(err);
    // console.log(info);
    user.otp = otp
    user.save()
    res.render("otp", {email: user.email} )
});

}

router.post('/otp/:email', async function(req, res, next) {
  try {
    const user = await User.findOne({email: req.params.email})
    if(!user){
      return res.send("no user foundddd")
    }else{
      if(user.otp == req.body.otp){
        user.otp = -1
        await user.save()
        res.render("newpassword" , {id: user._id})
      }else{
        user.otp = -1
        await user.save()
        res.send("plz enter velid otp") 
      }
    }
    
  } catch (error) {
    res.send(error)
  }

});
router.get('/newpassword/:id', function(req, res, next) {
  res.render('newpassword',{id: req.params.id});
});

router.post('/newpassword/:id',async function(req, res, next) {
  try {
    
    if(req.body.newpassword == req.body.cnfpassword){
      const user = await User.findById(req.params.id)

      await user.setPassword(req.body.newpassword)
      await user.save()
      res.redirect("/login")
    }else{
      res.send("new password and cnf password not same")
    }
  } catch (error) {
    
  }
});

router.get('/logout',isLoggedIn,function(req, res, next) {
  req.logout(()=>{
    res.redirect("/login");
  })
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
      next();
      // console.log("amit")
  } else {
      res.redirect("/login");
  }
};


router.get('/delete/:id',async function(req, res, next) {
  try {
     const del = await User.findByIdAndDelete(req.params.id);
     del.expenses.forEach( async (u)=>{
      await Expense.findByIdAndDelete(u)
    })
    res.redirect("/signup")
    
  } catch (error) {
    res.send(error)
    
  }

});

router.get('/update/:id', isLoggedIn , function(req, res, next) {
  res.render('update',{admin:req.user});
});

router.post('/update/:id', isLoggedIn ,async function(req, res, next) {
   await User.findByIdAndUpdate(req.params.id,req.body),
   res.redirect("/profile")
 });

router.get('/profilehome', isLoggedIn,async function(req, res, next) {
  try {
    const { expenses } = await req.user.populate("expenses");
    // console.log(req.user.expenses);
    res.render("profilehome",{admin:req.user,expenses});
  } catch (error) {
    res.send(error);
  }
});


router.get('/expenses', isLoggedIn, function(req, res, next) {
  res.render('expenses',{admin:req.user});
});

router.post('/expenses', isLoggedIn,async function(req, res, next) {
  try {
      const expense = new Expense(req.body);
      req.user.expenses.push(expense._id);
      expense.user = req.user._id;
      await expense.save()
      await req.user.save();
      
      res.redirect("/profilehome")
  } catch (error) {
    console.log
    res.send(error)
  }
});
router.get('/exdelete/:id',async function(req, res, next) {
  try {
    const deldata=req.user.expenses.findIndex((u)=>
    u._id == req.params.id)
    req.user.expenses.splice(deldata,1)
    await req.user.save()
    await Expense.findByIdAndDelete(req.params.id)
    res.redirect("/profilehome")  
  } catch (error) {
    console.log("ggg")
    res.send(error)
  }
  
});

router.get('/exupdate/:id',isLoggedIn,async function(req, res, next) {
  try {
    const data = await Expense.findById(req.params.id)
    res.render("editexpenses",{edit:data});
  } catch (error) {
    res.send(error)
  }
});

router.post('/editexpenses/:id',isLoggedIn,async function(req, res, next) {
  try {
    await Expense.findByIdAndUpdate(req.params.id,req.body)
    res.redirect("/profilehome");
  } catch (error) {
    res.send(error) 
  }
});
router.get("/filter", async function (req, res, next) {
  try {
      let { expenses } = await req.user.populate("expenses");
      expenses= expenses.filter((e) => e[req.query.key] == req.query.value);
      res.render("profilehome", { admin: req.user, expenses });
  } catch (error) {
      res.send(error);
  }
});

router.get('/about', function(req, res, next) {
  res.render('about',{admin:req.user});
});

module.exports = router;
