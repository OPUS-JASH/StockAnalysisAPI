
const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const cors = require('cors')

const fetchData = require('./Routes/fetchData.js');
const filterCSVFile = require('./Routes/filterCSVFile.js');
const validateDates = require('./Routes/validateDates.js');


const app = express();

mongoose.Promise = global.Promise;
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded());
app.use(cors());

const PORT = 3000;
const MONGO_URL = "mongodb+srv://OPUSTECH_STOCK:opus_jash_123@stockanalysis.755epv7.mongodb.net/?retryWrites=true&w=majority/test";


mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
  .then(() => {
    console.log("connection successful");
  })
  .catch((err) => console.log(err));

app.use('/api/fetch', fetchData);
app.use("/api/filterDataFromCSV",filterCSVFile)
app.use("/api/validateDates",validateDates)

app.listen(PORT, (error) =>{
	if(!error)
		console.log("Server is Successfully Running,and App is listening on port "+ PORT)
	else
		console.log("Error occurred, server can't start", error);
	}
);

