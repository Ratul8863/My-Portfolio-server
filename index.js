const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useUnifiedTopology: true });

let messagesCollection;

// Nodemailer transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Input validation
function validateContactInput(data) {
  const { firstName, lastName, email, message } = data;
  return firstName && lastName && email && message;
}

// Contact API
app.post('/contact', async (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;

  if (!validateContactInput(req.body)) {
    return res
      .status(400)
      .json({ success: false, message: 'Missing required fields' });
  }

  try {
    await messagesCollection.insertOne({
      firstName,
      lastName,
      email,
      phone: phone || '',
      message,
      createdAt: new Date(),
    });

    await transporter.sendMail({
      from: `"${firstName} ${lastName}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: 'New Contact Form Message',
      html: `
        <h2>New Message</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    });

    res.status(200).json({ success: true, message: 'Message sent and saved!' });
  } catch (err) {
    console.error('Error in POST /contact:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get recent messages (optional)
app.get('/messages/recent', async (req, res) => {
  try {
    const messages = await messagesCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(7)
      .toArray();

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ success: false });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('🎉 Portfolio backend is running!');
});

// Connect to DB and start server
async function startServer() {
  try {
    await client.connect();
    messagesCollection = client.db('PortfolioDB').collection('Messages');
    console.log('✅ Connected to MongoDB');

    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
}

startServer();
