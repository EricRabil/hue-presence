import { Router } from "express";
import GroupState from "node-hue-api/lib/model/lightstate/GroupState";

const router = Router();

router.use((req, res, next) => {
  if (!req.session?.authenticated) {
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

export { router as AuthenticatedRouter }