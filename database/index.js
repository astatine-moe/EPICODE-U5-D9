const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

let isConnected = false;

const connect = () => {
    return new Promise(async (resolve, reject) => {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

const getMongoose = () => {
    return mongoose;
};

const schemas = {
    User: require("./models/User"),
};

module.exports = {
    connect,
    getMongoose,
    schemas,
};
