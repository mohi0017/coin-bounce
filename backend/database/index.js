const mongoose = require('mongoose');
const ConnString = require("../config/index")
const MONGODB_CONN_STRING = ConnString.MONGODB_CONNECTION_STRING

const dbconnect = async () => {
    try {
        mongoose.set('strictQuery',false);
        const conn = await mongoose.connect(MONGODB_CONN_STRING);
        console.log(`Database connected to host: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

module.exports = dbconnect;
