const mongoose = require("mongoose");

const badRequestHandler = (err, req, res, next) => {
    if (err.status === 400 || err instanceof mongoose.Error.ValidationError) {
        res.status(400).send({ err: err.message });
    } else if (err instanceof mongoose.Error.CastError) {
        res.status(400).send({
            err: "You've sent a wrong _id in request params",
        });
    } else {
        next(err);
    }
};

const notFoundHandler = (err, req, res, next) => {
    if (err.status === 404) {
        res.status(404).send({ err: err.message });
    } else {
        next(err);
    }
};

const genericErrorHandler = (err, req, res, next) => {
    console.log(err);
    res.status(500).send({ err: "Generic Server Error" });
};

module.exports = {
    badRequestHandler,
    notFoundHandler,
    genericErrorHandler,
};
