
const dbconnect = require("./database/index");
const {PORT} = require("./config/index");
const express = require('express');
const router = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use(router);
dbconnect();
app.use('/storage',express.static('storage'));
app.use(errorHandler);
app.get('/', (req,res)=> res.json({msg:'Hello world124'}));
app.listen(PORT, console.log(`Our Backend is running : ${PORT}`));