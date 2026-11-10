import { Message } from '../models/Message.js';
import { getIO } from '../sockets/socketHandler.js';

// @desc    Get recent chat messages
// @route   GET /api/chat/messages
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const room = req.query.room || 'general';
    const messages = await Message.find({ room })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name email role avatar');

    // Return in chronological order
    res.status(200).json({
      success: true,
      data: messages.reverse(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post a chat message
// @route   POST /api/chat/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { message, room = 'general' } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.',
      });
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      room,
      message: message.trim(),
    });

    await newMessage.populate('sender', 'name email role avatar');

    const io = getIO();
    if (io) {
      io.to(room).emit('chat:message', newMessage);
    }

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    next(error);
  }
};
