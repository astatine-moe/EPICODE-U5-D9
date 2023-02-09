require("dotenv").config();

const http = require("http"),
    path = require("path");

const express = require("express"),
    morgan = require("morgan"),
    cors = require("cors"),
    passport = require("passport"),
    expressListRoutes = require("express-list-routes");

const database = require("./database");

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(morgan("dev"));
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require("cookie-parser")());

//wait for database connection
database
    .connect()
    .then(() => {
        //enable session using express-session with mongoDB as the session store, using separate collection
        const MongoStore = require("connect-mongo");
        const mongoose = require("mongoose");

        const sessionStore = new MongoStore({
            client: mongoose.connection.getClient(),
            collection: "sessions",
            dbName: "epicode-blog",
        });
        const sesh = {
            store: sessionStore,
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
                httpOnly: true,
            },
        };
        const session = require("express-session")(sesh);
        app.use(session);

        //use passport google
        app.use(passport.initialize());
        app.use(passport.session());
        require("./auths/google")(passport);

        app.use((req, res, next) => {
            console.log(req.cookies);
            next();
        });

        app.use("/auth", require("./routes/auth"));
        //routes
        const errors = require("./err");
        app.use(errors.badRequestHandler);
        app.use(errors.notFoundHandler);
        app.use(errors.genericErrorHandler);

        //list routes
        expressListRoutes({ prefix: "/" }, "API:", app);

        //start server
        server.listen(process.env.PORT, () => {
            console.log(
                `Server started on http://127.0.0.1:${process.env.PORT}`
            );
        });
    })
    .catch(console.error);

//catch any unhandled promise rejections
process.on("unhandledRejection", (err) => {
    //find the error line number
    process.exit(1);
});
