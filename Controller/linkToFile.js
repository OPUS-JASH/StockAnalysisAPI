const axios = require('axios');
const fs = require('fs');
const AdmZip = require('adm-zip');
const csvParser = require('csv-parser');
const {feedData,filterOnInstrument,insertFeedOnly,deleteFile} = require("./filterCSVFileController")
const Stock = require("../Models/Stock");

function getLinkData(input){
    // const options = { day: '2-digit', month: 'short', year: 'numeric' };
    // const currentDate = new Date();
    // const formattedDate = currentDate.toLocaleDateString('en-US', options).split(' ').join('-').replace(",","").toUpperCase();
    // const splitDate = formattedDate.split("-");
    // return {
    //     date : splitDate[1],
    //     month : splitDate[0],
    //     year : splitDate[2]
    // }
    const monthAbbreviations = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
    ];
  
    const splitDate = input.split("-");
    const formattedDate = {
      date: splitDate[0],
      month: monthAbbreviations[parseInt(splitDate[1], 10) - 1],
      year: splitDate[2]
    };
  
    return formattedDate;
    // return {
    //     date : "14",
    //     month : "JUL",
    //     year : "2023",
    // }
    // return {
    //     date : "18",
    //     month : "JUL",
    //     year : "2023",
    // }
}

function convertCsvToJson(csvFilePath) {
    return new Promise((resolve, reject) => {
      const jsonData = [];
  
      fs.createReadStream(csvFilePath)
        .pipe(csvParser())
        .on('data', (row) => {
          jsonData.push(row);
        })
        .on('end', () => {
          resolve(jsonData);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }


async function linkToFile(req,res){
  // console.log(req.body.date);
    const date = getLinkData(req.body.date);
    // console.log(date);
    const LINK = `https://archives.nseindia.com/content/historical/DERIVATIVES/${date.year}/${date.month}/fo${date.date}${date.month}${date.year}bhav.csv.zip`;

    try {
        // Download the zip file
        let response = null;
        response = await axios.get(LINK, { responseType: 'arraybuffer' });
        
        // console.log(response);
        const zipFilePath = `./uploads/fo${date.date}${date.month}${date.year}bhav.csv.zip`;
        fs.writeFileSync(zipFilePath, response.data);
    
        // Extract the contents of the zip file
        const outputFolderPath = './uploads/';
        const zip = new AdmZip(zipFilePath);
        zip.extractAllTo(outputFolderPath, /*overwrite*/ true);
    
    
        // Find the CSV file inside the unzipped folder
        const csvFilePath = fs.readdirSync(outputFolderPath).find(file => file.endsWith('.csv'));
        
        if (csvFilePath) {
            // convert data in json 
            const jsonObj = await convertCsvToJson(`${outputFolderPath}/${csvFilePath}`);
            const afterFilter = filterOnInstrument(jsonObj);
            // console.log(afterFilter);
            Stock.find({})
            .then(response => {
                if(response.length === 0){
                    feedData(afterFilter);
                    // datesAvailable(jsonObj);
                }else{
                    insertFeedOnly(afterFilter);
                    // datesAvailable(jsonObj);

                }
            })
            deleteFile(zipFilePath);
            deleteFile("./uploads/"+csvFilePath);

            res.send({msg : "Data Uploaded successfuly."});    
        } else {
          res.send({msg :'No CSV file found inside the zip folder.'});
        }
      } catch (error) {
        res.status(200);
        res.send({msg :'Error downloading, extracting, or converting the zip file:'});
      }
}

module.exports= {
    linkToFile
}