const Stock = require("../Models/Stock")
const axios = require("axios");

function validate(req,res){
    Stock.find({}).skip(0).limit(1).exec()
        .then(data => {
            const {date1,date2} = req.body;
            // res.send("hello");
            const result= {
                date1 : false,
                date2 : false
            }
            // console.log(data[0].price);
            data[0].price.map((item) => {
                if(item.date === date1) result.date1 = true;
                if(item.date === date2) result.date2 = true;
            })
            // console.log(result);
            if(!(result.date1 && result.date2)){ 
                res.send({status : "error",msg : `data of ${date1} and ${date2} both are not present.`})
                return;
            }
            if(!result.date1){
                res.send({status : "error",msg : `data of ${date1} is not present.`})
                return;
            }
            if(!result.date2){
                res.send({status : "error",msg : `data of ${date2} is not present.`})
                return;
            }

            res.send({status : "ok"})
        })
}

module.exports = {
    validate
}