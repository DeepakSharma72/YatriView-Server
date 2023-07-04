const express = require('express');
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const dontenv = require('dotenv');
dontenv.config();

const cors = require('cors');
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));

const connectDB = require('./DB/connection');
connectDB();


const userRoute = require('./Routers/userRoute');
app.use('/', userRoute);
const blogRoute = require('./Routers/blogRoute');
app.use('/', blogRoute);
const blogRateRoute = require('./Routers/blogRatingRoute');
app.use('/', blogRateRoute);
const contactUsRoute = require('./Routers/ContactUs');
app.use('/', contactUsRoute);
const searchRoute = require('./Routers/searchRoute');
app.use('/', searchRoute);

app.listen(process.env.PORT, () => {
    console.log('Server is listening at port ', process.env.PORT);
})

