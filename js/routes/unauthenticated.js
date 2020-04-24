"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_1 = require("express");
const Configuration_1 = require("../Configuration");
const router = express_1.Router();
exports.UnauthenticatedRouter = router;
router.post('/login', async (req, res) => {
    const { password } = req.body;
    const valid = await bcrypt_1.default.compare(password, Configuration_1.CONFIG.web.passwordHash);
    if (!valid) {
        res.status(401).render('login', { error: 'Incorrect password.' });
        return;
    }
    req.session.authenticated = true;
    res.redirect('/');
});
router.get('/login', async (req, res) => {
    var _a;
    if ((_a = req.session) === null || _a === void 0 ? void 0 : _a.authenticated) {
        res.redirect('/');
        return;
    }
    res.render('login');
});
router.get('/logout', async (req, res) => {
    req.session = null;
    res.redirect('/');
});
