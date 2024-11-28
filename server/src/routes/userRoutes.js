const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/getusername", userController.getUserUsername);
router.post("/fatch-profile-photo", userController.fetchProfilePhoto);
router.post("/fetch-settings", userController.fetchSettings);
router.post("/save-settings", userController.saveSettings);

module.exports = router;
