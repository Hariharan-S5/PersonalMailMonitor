const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/getuser/permisson', userController.getUserPermission);
router.post('/newuser/post', userController.createNewUser);
router.delete('/clearusers', userController.clearUsers);

module.exports = router;
