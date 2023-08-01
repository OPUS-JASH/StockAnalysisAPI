const { Router } = require('express');

const fetchDataControll = require('../Controller/fetchDataControll.js');

const router = Router();

router.post('/', fetchDataControll.fetchData);
// router.get('/', fetchDataControll.getDates);

module.exports = router;
