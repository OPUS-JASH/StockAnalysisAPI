const { Router } = require('express');

const fetchDataControll = require('../Controller/fetchDataControll.js');
const filterCSVFileController = require('../Controller/filterCSVFileController.js');
const linkToFile = require("../Controller/linkToFile.js")
const multer = require('multer');

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/file', upload.single('file'),filterCSVFileController.filterAndSave);
router.post('/link',linkToFile.linkToFile);


module.exports = router;
