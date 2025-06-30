const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


const  messagesCollection = client.db('PortfolioDB').collection('Messages'); 

const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });



     app.post('/contact', async (req, res) => {
      const { firstName, lastName, email, phone, message } = req.body;

const result =  await messagesCollection.insertOne({
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

      })

      
app.get('/contact', (req, res) => {
  res.send('📮 This is the contact API. Use POST to submit.');
});

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





    


// ✅ Default route
app.get('/', (req, res) => {
  res.send('🎉 Portfolio backend is running!');
});

// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
