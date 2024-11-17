const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    visibility: { type: String, enum: ['public', 'private'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Message', messageSchema);
