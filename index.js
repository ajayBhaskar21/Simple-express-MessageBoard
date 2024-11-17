require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('./models/user');
const Message = require('./models/message');

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.redirect('/login');

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        next();
    });
};

// Routes
// 1. Main Board: Display public messages
app.get('/', async (req, res) => {
    const messages = await Message.find({ visibility: 'public' });
    res.render('index', { messages });
});

// 2. Login
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Invalid credentials');
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/private');
});

// 3. Post a Message
app.get('/post-message', authenticateToken, (req, res) => {
    res.render('post-message');
});

app.post('/post-message', authenticateToken, async (req, res) => {
    const { title, content, visibility } = req.body;
    const message = new Message({ title, content, visibility, userId: req.user.id });
    await message.save();
    res.redirect('/');
});

// 4. Private Messages
app.get('/private', authenticateToken, async (req, res) => {
    const messages = await Message.find({ userId: req.user.id, visibility: 'private' });
    res.render('private-messages', { messages });
});

// 5. Logout
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
