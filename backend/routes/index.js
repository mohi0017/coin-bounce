const express = require('express');
const authController = require('../controller/authController')
const router = express.Router();
const auth = require("../middlewares/auth");
const blogController = require('../controller/blogController');
const commentController = require('../controller/commentController');
// User
// register
router.post('/register', authController.register);
// login
router.post('/login', authController.login);
// logout
router.post('/logout', auth, authController.logout);
// refresh
router.get('/refresh', auth, authController.refresh);

// Blog
// CRUD
// Create
router.post('/blog',auth,blogController.create);
// read all blogs
router.get('/blog/all',auth,blogController.getAll);
// Read blog by id
router.get('/blog/:id',auth,blogController.getById);
// update
router.put('/blog',auth,blogController.update);
// Delete
router.delete('/blog/:id',auth,blogController.delete);
// comment
// create comment
router.post('/comment',auth,commentController.create);
// read comments by id
router.get('/comment/:id',auth,commentController.getById);


module.exports = router;