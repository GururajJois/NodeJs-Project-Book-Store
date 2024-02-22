const path = require("path");
const csrf = require("csurf"); // USED TO GIVE THE ENCRYPTED TOKEN TO USER TO INDETIFY HIM FOR SECURITY REASON AND LOGIN
const express = require("express");
const bodyParser = require("body-parser"); // USED PARSE(FILTER) THE REQUEST AND USED TO RENDER THE STATIC FILE
const multer = require("multer"); // iT IS USED TO STORE THE UPLOED IMAGES IN LOCAL PROJECT FOLDER
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session); // USED TO STORE THE USER SESSION IN DATABASE
const errorController = require("./controllers/error");
// const mongoConnect = require('./util/database').mongoConnect;
const flash = require("connect-flash"); // USED TO THROW THE ERROR IN KEY PAIR
const User = require("./models/user");
const MONGODB_URI = "YOUR MONGODB CLOUD DATABASE URL";
const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
}); // USER SESSION STROED IN DATABASE

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toDateString() + "-" + file.originalname);
  },
}); // USED TO STORE THE IMAGE WITH TODAY'S DATE AND UPLODED FILE NAME USING CALLBACK

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}; // BEFORE USING THE MULTER CHECKING THE FORMAT OF THE IMAGE USING CALLBACK

const csrfProtection = csrf(); // USED CSRF TOKEN TO IDENTIFY THE USER WITH UNIQUE LOGIN ID

const mongoose = require("mongoose");

app.set("view engine", "ejs"); // WE ARE USING EJS AS CLIENT SIDE HTML SO MENTIONING THAT
app.set("views", "views"); // SPECIFY THE PATH OF FOLDER OF HTML FILE

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
// ABOVE ALL ARE THE ROUTES

app.use(bodyParser.urlencoded({ extended: false })); // PARSING THE REQUEST BECAUSE IT COMES IN DIFFERENT MANNER SO TO UNDERSATNAD USE THE REQUEST AS PER OUR USE WE PARSE THE REQUEST

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
); // USING MULTER TO STORE THE FILE AND WITH CONDTION CHECK

app.use(express.static(path.join(__dirname, "public"))); // IT IS USED TO RENDER THE STACTIC CSS FILE WHICH IS PUBLIC FOLDER AS MENTIONED ABOVE
app.use("/images", express.static(path.join(__dirname, "images")));
// SAME USED TO RENDER THE STATIC IMAGES WHICH PRESET IN IMAGES FOLDER WHICH WE STORED USING MULTER
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
); // CREATING A SEESION FOR LOOGED IN USER

app.use(csrfProtection); // FOR LOOGED IN USER ASSINGING CSURF TOKEN FOR SECURITY REASON
app.use(flash()); // USING FALSH PACKAGE TO THROW ERROR IT IS USED IN CONTROLLERS
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  // throw new Error("Dummy");
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorController.get500);

app.use(errorController.get404);

app.use((error, req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Error!",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(3000);

    console.log("connected");
  })
  .catch((err) => {
    console.log(err);
  }); // DATA BASE CONNECTION
