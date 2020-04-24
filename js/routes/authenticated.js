"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
exports.AuthenticatedRouter = router;
router.use((req, res, next) => {
    var _a;
    if (!((_a = req.session) === null || _a === void 0 ? void 0 : _a.authenticated)) {
        res.status(401).render('login', { message: 'You are not logged in.' });
        return;
    }
    next();
});
router.get('/', (req, res) => {
    res.redirect('/admin/panel');
});
router.get('/panel', (req, res) => {
    res.render('panel', {
        url: req.controllers.presenti.url
    });
});
router.get('/api/rotation', (req, res) => {
    res.json({
        rotating: req.controllers.hue.rotating
    });
});
router.put('/api/rotation', (req, res) => {
    const { rotating } = req.body;
    req.controllers.hue.rotating = !!rotating;
    res.json({
        ok: true
    });
});
router.post('/api/reset', async (req, res) => {
    await req.controllers.hue.updateToColor('#FFFFFF', 0, true);
    res.json({
        ok: true
    });
});
