import express = require('express');
import Authorization from '../helpers/authorization';
const router = express.Router();

const users_controller = require('../controllers/users/users_controllers');

router.post('/signup', users_controller.create);
router.post('/signin', users_controller.signin)

//Authentication check
router.use(Authorization);

router.get('/', users_controller.show);


module.exports = router;