const mongoose = require("mongoose");
const Stock = require("../Models/Stock");

function sortData(filter,data){
	for(const i in filter){
		if(filter[i].sort){
			if(filter[i].type === 1){
				data.sort((a,b) => a[i] - b[i])
			}else{
				data.sort((a,b) => b[i]- a[i])
			}
		}
	}
}



const calculateFields = (price) => {
	const close1 = parseFloat(price[0].close);
	const close2 = parseFloat(price[1].close);
	const open1 = parseFloat(price[0].open);
	const open2 = parseFloat(price[1].open);
	const contract = parseInt(price[1].contracts);
	// console.log(open1,open2);
  
	const priceChange = (((close2 - close1) / close1) * 100).toFixed(5);
	const OIChange = (((open2 - open1) / open1) * 100).toFixed(5);

	
  
	const statusFunction = () => {
	  return OIChange > 0 && priceChange > 0.5
		? "LONGBUILDUP"
		: OIChange > 0 && priceChange < -0.5
		? "SHORTBUILDUP"
		: OIChange < 0 && priceChange < -0.5
		? "LONGUNWINDING"
		: OIChange < 0 && priceChange > 0.5
		? "SHORTCOVERING"
		: "-";
	};
  
	return {
	  priceChange,
	  OIChange,
	  contract,
	  status: statusFunction(),
	};
  };

  async function getDates() {
	// let data;
	const response = await Stock.find({}).skip(0).limit(1).exec();
		
			function formatDate(inputDate) {
				const day = String(inputDate.getDate()).padStart(2, '0');
				const month = String(inputDate.getMonth() + 1).padStart(2, '0');
				const year = String(inputDate.getFullYear());
				const formattedDate = `${day}-${month}-${year}`;
				return formattedDate;
			}
			if(response.length > 0) {
				const {price} = response[0];
				const datesArray = price.map(item => item.date);
				// console.log(datesArray);	
				const parseDate = (dateString) => {
					const [day, month, year] = dateString.split("-");
					return new Date(`${year}-${month}-${day}`);
				  };
				  
				  // Convert date strings to Date objects
				  const datesAsObjects = datesArray.map(parseDate);
				  datesAsObjects.sort((a, b) => a - b);
				  const length = datesAsObjects.length;
				  console.log(formatDate(datesAsObjects[length-1]));
					return({
					date1 : formatDate(datesAsObjects[length-2]),
					date2 : formatDate(datesAsObjects[length-1])
				  })
			}
			return({
				date1 : "",
				date2 : ""
			})
			
}

const fetchData =  async (req, res)=>{
	let {date1,date2} = req.body.dates;
	if(date1==="" && date2==="") {
		console.log("hello");
		const date = await getDates();
		
		date1 = date.date1;
		date2 = date.date2;

	}
	if(date1.split("-")[0] > date2.split("-")[0]){
		let temp = date1;
		date1 = date2;
		date2=temp;
	}
	console.log("here");
	const {noOfRows,page,searchTerm} = req.body;
	let i = (noOfRows*(page-1))
	// const date1 = req.body.date1;
	// const date2 = req.body.date2;
	// console.log(req.body);
	Stock.aggregate([
		{
		$match: {
			symbol: { $regex: new RegExp(`^${searchTerm}`, 'i') },
			$or: [
			  { 'price.date': date1 },
			  { 'price.date': date2 },
			],
		  },
	},
	{
		$project: {
		  _id: 1,
		  instrument: 1,
		  symbol: 1,
		  price: {
			$filter: {
			  input: '$price',
			  as: 'item',
			  cond: {
				$or: [
				  { $eq: ['$$item.date', date1] },
				  { $eq: ['$$item.date', date2] },
				],
			  },
			},
		  },
		  __v: 1,
		},
	  },
	  {
		$match: {
		  $expr: { $eq: [{ $size: '$price' }, 2] }, 
		},
	  }
	])
 .then(response => {
	//  console.log(startIndex,endIndex);
	 const processedData = response.map((item) => {
		 const { _id, symbol, price } = item;
		 const { priceChange, OIChange, contract, status } = calculateFields(price);
		 
		 return {
			 _id: _id.$oid,
			 ...item,
			 priceChange,
			 OIChange,
			 contract,
			 status,
        };
	});
	
	//   sorting 
	const {filter} = req.body;

	// if(filter.OIChange.sort){
	// 	sortData(filter.OIChange.type,"OIChange",processedData)
	// }
	// if(filter.priceChange.sort){
	// 	sortData(filter.priceChange.type,"priceChange",processedData)
	// }
	sortData(filter,processedData);
	// processedData.sort(sortFields);
	  
	  //   pagination 
	
	const startIndex = (page - 1) * noOfRows;
	const endIndex = Math.min(startIndex + noOfRows - 1, processedData.length - 1);
	const paginatedData = processedData.slice(startIndex, endIndex + 1);
	
	res.send({paginatedData,dates:{date1,date2}})
})
 .catch((err) => {
	res.send({msg : "Data of this date is not present, upload first to analiys."});
 })
}



module.exports = {
	fetchData,
}