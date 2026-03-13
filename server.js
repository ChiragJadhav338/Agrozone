 const express = require("express");
const mongoose = require("mongoose");
const app = express();

// ==========================
// Middleware
// ==========================
// app.use(cors());
app.use(express.json());
app.use(express.static("public"));


// ==========================
// MongoDB Connection
// ==========================
mongoose.connect("mongodb://localhost:27017/agrozone", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected ✔"))
.catch(err => console.error("MongoDB Error ❌", err));

// ==========================
// SCHEMAS
// ==========================
const Contact = mongoose.model("Contact", new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true }
}));

const Rate = mongoose.model("Rate", new mongoose.Schema({
    crop: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true }
}));

const User = mongoose.model("User", new mongoose.Schema({
    fullname: { type: String, required: true },
    contact: { type: String, required: true },
    location: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

const Buy = mongoose.model(
    "Buy",
    new mongoose.Schema({
        fullname: {
            type: String,
            required: true
        },
        contact: {
            type: String,
            required: true
        },
        cart: {
            type: Array,   // [{ productName, price, quantity }]
            required: true
        },
        totalPrice: {
            type: Number,
            required: true
        },
        paymentMode: {
            type: String,
            required: true,
            default: "COD"
        },
        address: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    })
);


// ==========================
// ROUTES
// ==========================

// Save Contact Form
app.post("/save-contact", async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();
        res.send("Contact Saved!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving contact");
    }
});

// Save Market Rate
app.post("/save-rate", async (req, res) => {
    try {
        const rate = new Rate(req.body);
        await rate.save();
        res.send("Rate Saved!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving rate");
    }
});

// ==========================
// NEW USER REGISTRATION
// ==========================
app.post("/register", async (req, res) => {
    try {
        console.log("Received:", req.body);

        const { fullname, contact, location, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).send("User already exists");
        }

        const newUser = new User({ fullname, contact, location, email, password });
        await newUser.save();

        res.status(201).send("Registration Successful");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error registering user");
    }
});

// ==========================
// USER LOGIN
// ==========================
app.post("/login", async (req, res) => {
    try {
        const { fullname, password } = req.body;

        // Find user by fullname
        const user = await User.findOne({ fullname });
        if (!user) return res.status(404).send("User not found");

        // Match password
        if (user.password === password)
            res.send("Login Successful");
        else
            res.status(401).send("Incorrect Password");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error during login");
    }
});


// ==========================
// BUY NOW
// ==========================
app.post("/buy-now", async (req, res) => {
    try {
        const {
            fullname,
            contact,
            cart,
            totalPrice,
            address
        } = req.body;

        // Basic validation
        if (!fullname || !contact || !cart || cart.length === 0 || !totalPrice) {
            return res.status(400).json({
                message: "Missing required order details"
            });
        }

        const order = new Buy({
            fullname,
            contact,
            cart,
            totalPrice,
            paymentMode: "COD",
            address
        });

        await order.save();

        res.status(201).json({
            message: "Order placed successfully",
            orderId: order._id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Error saving order"
        });
    }
});


// ==========================
// Start server
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} ✔`));
