// const mongoose = require("mongoose");
// const Data = require("../Models/Data");
const csv = require('csvtojson');
const fs = require('fs');
const Stock = require("../Models/Stock");


// format date in standard format
function formatDate(inputDateStr) {
    const inputDate = new Date(inputDateStr);
    const day = String(inputDate.getDate()).padStart(2, '0');
    const month = String(inputDate.getMonth() + 1).padStart(2, '0');
    const year = String(inputDate.getFullYear());
    const formattedDate = `${day}-${month}-${year}`;
    return formattedDate;
}

function deleteFile(path){
    fs.unlink(path, (err) => {
        if (err) {
            throw err;
        }
    });
}

// last thursday of the present month
function getLastThursdayOfCurrentMonth() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    let lastThursday = null;
  
    // Loop through the days of the month starting from the last day and find the last Thursday
    for (let day = lastDayOfMonth; day > 0; day--) {
      const currentDate = new Date(year, month, day);
      const dayOfWeek = currentDate.getDay();
  
      if (dayOfWeek === 4) { // Thursday: 0 for Sunday, 1 for Monday, ..., 6 for Saturday
        lastThursday = currentDate;
        break;
      }
    }
  
    const finalDate = new Date(lastThursday);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = finalDate.toLocaleDateString('en-GB', options).toLowerCase().replace(/\s/g, '-').replace(',', '');
    return formattedDate;
  }

//   apply require filter
function filterOnInstrument(json){
    const data = json.filter(item => (item.INSTRUMENT === "FUTIDX" || item.INSTRUMENT === "FUTSTK") && (formatDate(item.EXPIRY_DT.toUpperCase()) === formatDate(getLastThursdayOfCurrentMonth().toUpperCase())))
    return data;
}

// when data base is empty at that time insert data
function feedData(data){
    data.map(item => {
        const temp = {
            instrument : item.INSTRUMENT,
            symbol : item.SYMBOL,
            price: [
                {
                    date : formatDate(item.TIMESTAMP),
                    open : item.OPEN_INT,
                    close : item.CLOSE,
                    contracts  : item.CONTRACTS
                }
            ]
        }
        const s = new Stock(temp);
        s.save()
            .then(response => {})
            .catch(err => {
                throw err;
            })
    })
}


// when some data is present in database at that time only enter data in price array
function insertFeedOnly(data){
    data.map(item => {
        const newData =  {
            date : formatDate(item.TIMESTAMP),
            open : item.OPEN_INT,
            close : item.CLOSE,
            contracts  : item.CONTRACTS
        };

            Stock.find({instrument : item.INSTRUMENT , symbol : item.SYMBOL})
            .then(response => {
                    if(response.length){
                            const data = response[0].price;
                        final = data.filter(temp => temp.date === formatDate(item.TIMESTAMP));

                        // if data is not present at that time add in database
                        if(final.length === 0){
                            Stock.findOneAndUpdate({ instrument : item.INSTRUMENT,symbol : item.SYMBOL}, 
                                { $push: { price: newData } })
                                    .then(response => {})
                                    .catch(err =>{ 
                                        throw err;
                                    })
                        }
                }

            })
    })
}

const filterAndSave = (req, res)=>{
    if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
    }
    const file = req.file;
    try{
        csv()
        .fromFile(file.path)
        .then((jsonObj)=>{
            const afterFilter = filterOnInstrument(jsonObj);
            
            Stock.find({})
                .then(response => {
                    if(response.length === 0){
                        feedData(afterFilter);
                    }else{
                        insertFeedOnly(afterFilter);
                    }
                })
    
        })
        .then(() => {
            // fs.unlink(file.path, (err) => {
            //     if (err) {
            //       console.error(err)
            //       return
            //     }
            // });
            deleteFile(file.path);
            res.send({msg : "File Uploaded successfully."})
        })
    }
    catch(err){
        res.send({msg :"Something went wrong."+err})
    }


}

module.exports = {
	// fetchData,
	filterAndSave,
    insertFeedOnly,
    feedData,
    filterOnInstrument,
    getLastThursdayOfCurrentMonth,
    formatDate,
    deleteFile
}
