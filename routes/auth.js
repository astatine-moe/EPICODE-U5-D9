const router = require("express").Router(),
    jwt = require("jsonwebtoken"),
    database = require("../database"),
    User = database.schemas.User;

const passport = require("passport");
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "http://localhost:3000/error",
    }),
    (req, res) => {
        const user = req.user;
        const accessToken = jwt.sign(
            {
                id: user._id,
                email: user.email,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "1h",
            }
        );
        const refreshToken = jwt.sign(
            {
                id: user._id,
                email: user.email,
            },
            process.env.REFRESH_TOKEN_SECRET
        );
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });

        res.redirect("http://localhost:3000");
    }
);

router.get("/logout", (req, res) => {
    //logout user
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.redirect("http://localhost:3000");
});

router.post("/google/refresh", (req, res) => {
    //refresh access token
    const refreshToken = req.body.refreshToken;
    if (refreshToken == null) {
        return res.send({
            status: false,
        });
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.send({
                status: false,
                message: "Invalid refresh token",
            });
        }
        const accessToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "1h",
            }
        );
        res.send({
            status: true,
            accessToken,
        });
    });
});

router.get("/google/user", (req, res) => {
    //return user data
    const accessToken = req.cookies.accessToken;
    if (accessToken == null) {
        return res.send({
            status: false,
        });
    }

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.send({
                status: false,
            });
        }
        User.findOne({ googleId: user.id }, (err, user) => {
            if (err) {
                return res.send({
                    status: false,
                    message: "Error finding user",
                });
            }
            res.send({
                status: true,
                user,
            });
        });
    });
});

router.get("/get_token", (req, res) => {
    //return access token
    const accessToken = req.cookies.accessToken;
    if (accessToken == null) {
        return res.send({
            status: false,
            message: "No access token",
        });
    }
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken == null) {
        return res.send({
            status: false,
            message: "No refresh token",
        });
    }
    //verify refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.send({
                status: false,
                message: "Invalid refresh token",
            });
        }

        //verify access token

        jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET,
            (err, user) => {
                if (err) {
                    return res.send({
                        status: false,
                        message: "Invalid access token",
                    });
                }

                res.send({
                    status: true,
                    accessToken,
                    refreshToken,
                });
            }
        );
    });
});

module.exports = router;
