const { Router } = require('express');

const validateDatesController = require('../Controller/validateDatesController.js');

const router = Router();

router.post('/', validateDatesController.validate);
// router.post('/', fetchDataControll.pagenation);

module.exports = router;
