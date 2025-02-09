const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://127.0.0.1:27017/todo-list')
    .then(() => console.log('✅ Connected to local MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const User = mongoose.model('User', UserSchema);

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Task = mongoose.model('Task', TaskSchema);

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; 
    if (!token) return res.status(401).json({ error: "No access" });

    try {
        const decoded = jwt.verify(token, 'secret');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Enter your login and password" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "This user already exists" });
        }

        const user = new User({ username, password });
        await user.save();

        res.status(201).json({ message: "User registered" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ error: "Incorrect data" });
        }

        const token = jwt.sign({ userId: user._id }, 'secret', { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const task = new Task({ ...req.body, userId: req.userId });
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
    const tasks = await Task.find({ userId: req.userId });
    res.json(tasks);
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            req.body,
            { new: true }
        );
        if (!task) return res.status(404).json({ error: "Task not found" });
        res.json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!task) return res.status(404).json({ error: "Task not found" });
        res.json({ message: "Task deleted" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
