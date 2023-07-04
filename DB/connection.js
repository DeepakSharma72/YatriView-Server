const mongoose = require('mongoose');


mongoose.set("strictQuery", true);
const userName = encodeURIComponent(process.env.DBUSERNAME);
const password = encodeURIComponent(process.env.DBPASSWORD);
const connectionURL = `mongodb+srv://${userName}:${password}@${process.env.CONNECTION_ENDPOINT}`;
const tempURL = 'mongodb://127.0.0.1:27017/YatriView';
const connectDB = async () => {
    try {
        await mongoose.connect(tempURL);
        console.log('connection Successfull');
    }
    catch (err) {
        console.log('Opps.. Unable to connect to DB', err);
    }
}

module.exports = connectDB;