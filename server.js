const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use(express.json());

// Stripe checkout route
app.post("/api/checkout", async (req, res) => {
  try {
    const { items } = req.body;
    const normalizedItems = Array.isArray(items) ? items : [items];
    const lineItems = normalizedItems?.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: item.description,
          images: [item.imageUrl],
        },
        unit_amount: item.price * 100, // Convert price to cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancelled`,
    });

    console.log("sessionId---->", session.id); // This will log the sessionId to your server's console
    res.json({ sessionId: session.id }); // This sends the sessionId back to your frontend
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating checkout session" });
  }
});

// Listen on the specified port
const PORT = process.env.PORT || 3001; // Default to 3001 if process.env.PORT is not set
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
