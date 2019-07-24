const { prisma } = require('../../../generated/prisma-client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

const secret: any = process.env.SECRET;

exports.create = async function (req, res) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const newUser = await prisma.createUser({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: hashedPassword
    })
    res.status(200).send(newUser);
  } catch (e) {
    console.log(e);
    res.status(400).send({ status: 'failed', message: 'User wasn\'t created' })
  }
}

exports.signin = async function (req, res) {
  try {
    const user = await prisma.user({ email: req.body.email })
    bcrypt.compare(req.body.password, user.password, (_err: Object, isMatch: boolean) => {
      if (isMatch) {
        const now = new Date();
        const oneWeekForward = now.getDate() + 7;
        const token = jwt.sign({ userId: user.id, validUntil: oneWeekForward }, secret);
        res.cookie('token', `Bearer ${token}`, { maxAge: 7 * 24 * 60 * 60 * 1000 /* One week from now */ })
        res.status(200).send({ user: user, token: token })
      } else {
        res.status(401).send({ status: 'failed', message: 'User wasn\'t signed in, verify your credentials' })
      }
    })
  } catch (e) {
    console.log(e)
    res.status(401).send({ status: 'failed', message: 'User wasn\'t signed in, verify your credentials' })
  }
}

exports.show = async function (req, res) {
  try {
    res.status(200).send(req.user);
  } catch (e) {
    console.log(e)
    res.status(400).send({ status: 'failed', message: 'Couldn\'t obtain user information' })
  }
}
