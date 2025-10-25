import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = "5a40c55151c241e3a007f2562fd4e1dd";
const CLIENT_SECRET = "eat_2G6i70t3CYhTxZ1ytUo04vA1IhZnmoziW_p1Pgd";

app.post("/exchange", async (req, res) => {
  try {
    const { code } = req.body;
    const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

    const r = await fetch("https://login.eveonline.com/v2/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=authorization_code&code=${code}`,
    });

    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.send("EVE Proxy is running"));
app.listen(3000, () => console.log("EVE SSO proxy running on port 3000"));
