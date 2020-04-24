import bcrypt from "bcrypt";
import { Router } from "express";
import { CONFIG } from "../Configuration";

const router = Router();

router.post('/login', async (req, res) => {
  const { password } = req.body;

  const valid = await bcrypt.compare(password, CONFIG.web.passwordHash!);

  if (!valid) {
    res.status(401).render('login', { error: 'Incorrect password.' });
    return;
  }

  req.session!.authenticated = true;

  res.redirect('/');
});

router.get('/login', async (req, res) => {
  if (req.session?.authenticated) {
    res.redirect('/');
    return;
  }

  res.render('login');
});

router.get('/logout', async (req, res) => {
  req.session = null;
  res.redirect('/');
})

export { router as UnauthenticatedRouter }