import express = require('express');
import Authorization from '../helpers/authorization';
const router = express.Router();

const usersController = require('../controllers/users/usersControllers');

router.post('/signup', usersController.create);
router.post('/signin', usersController.signin)

//Authentication check
router.use(Authorization);

router.get('/', usersController.show);


module.exports = router;