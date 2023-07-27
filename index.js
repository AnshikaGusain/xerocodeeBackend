const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();


const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(`mongodb+srv://admin-anshika:${process.env.PASSWORD}@cluster0.wzrpvnt.mongodb.net/xerocodee`);

const mailSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
});
const Mail = new mongoose.model("mail", mailSchema);

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};


const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  });
  
  // Hash the password before saving to the database
  userSchema.pre('save', async function (next) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
      next();
    } catch (error) {
      next(error);
    }
  });
  
  const User = mongoose.model('User', userSchema);

  app.get("/",(req,res)=>{
    res.send("hello");
  })

  
  app.post('/signup', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if the email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json('Email already exists.');
      }
  
      // Create a new user document
      const newUser = new User({ email, password });
  
      // Save the new user to the database
      await newUser.save();
      return res.status(201).json('User created successfully.');
    } catch (error) {
      console.error(error);
      return res.status(500).json('Internal server error.');
    }
  });


  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if the user exists in the database
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json('Invalid email or password.' );
      }
  
      // Compare the provided password with the hashed password in the database
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json('Invalid email or password.' );
      }
  
      // Password is valid, login successful
      return res.status(200).json( 'Login successful.' );
    } catch (error) {
      console.error(error);
      return res.status(500).json('Internal server error.' );
    }
  });
  



app.post('/submit', async (req, res) => {
    try {
        const { name, email } = req.body;

        // Validate the data (you can add more validation if needed)
        if (!name || !email) {
            return res.status(400).json('Name and Email are required.');
        }

        if(!isValidEmail(email)){
            return res.status(400).json('Email is not valid')
        }

        const existingEmail = await Mail.findOne({ email });

        if (existingEmail) {
            // If the email already exists, return a conflict error
            return res.status(409).json( 'Email already exists.' );
        }

        // Create a new email document and save it to the database
        const newEmail = new Mail({ name, email });
        await newEmail.save();

        return res.status(201).json('Mail submitted successfully.' );
    } catch (error) {
        console.error(error);
        return res.status(500).json('Internal server error.');
    }
});

app.get('/emails', async (req, res) => {
    try {
      const emails = await Mail.find();
      return res.status(200).json(emails);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  });


  // PUT endpoint to update an existing email
app.put('/emails/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email } = req.body;
  
      // Check if the email exists in the database
      const existingEmail = await Mail.findById(id);
      if (!existingEmail) {
        return res.status(404).json({ error: 'Email not found.' });
      }
  
      // Update the existing email and save it to the database
      existingEmail.name = name;
      existingEmail.email = email;
      await existingEmail.save();
  
      return res.status(200).json({ message: 'Email updated successfully.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  });
  
app.listen(PORT || process.env.PORT, () => {
    console.log(`Server is running`);
});
