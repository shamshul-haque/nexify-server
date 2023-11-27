const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

// parsers
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// connecting uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gwehrjf.mongodb.net/?retryWrites=true&w=majority`;

// db connection
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// db collections
const userCollection = client.db("nexifyDB").collection("users");
const productCollection = client.db("nexifyDB").collection("products");

// middleware to verify token
const verifyToken = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized Access" });
    }
    req.user = decode;
    next();
  });
};

const verifyAdmin = async (req, res, next) => {
  const decodedUser = req.user;
  const query = { email: decodedUser.email };
  const user = await userCollection.findOne(query);
  const isAdmin = user.role === "admin";
  if (!isAdmin) {
    return res.status(403).send({ message: "Forbidden Access" });
  }
  next();
};

const verifyModerator = async (req, res, next) => {
  const decodedUser = req.user;
  const query = { email: decodedUser.email };
  const user = await userCollection.findOne(query);
  const isModerator = user.role === "moderator";
  if (!isModerator) {
    return res.status(403).send({ message: "Forbidden Access" });
  }
  next();
};

async function run() {
  try {
    // await client.connect();

    // create token when user login
    app.post("/api/v1/users/access-token", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "3hr",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // clear token when user logged out
    app.post("/api/v1/users/logout", async (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
        })
        .send({ success: true });
    });

    // add new users to db when create account
    app.post("/api/v1/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isExistUser = await userCollection.findOne(query);
      if (isExistUser) {
        return res.send({ message: "User already exits", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // get all user by verified admin
    app.get("/api/v1/users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // checking specific user is normal user or moderator or admin
    app.get("/api/v1/users/admin", verifyToken, async (req, res) => {
      const queryEmail = req.query.email;
      const tokenEmail = req.user.email;

      if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "Forbidden Access" });
      }

      let query = {};
      if (queryEmail) {
        query.email = queryEmail;
      }
      const user = await userCollection.findOne(query);

      let admin = false;
      if (user) {
        admin = user.role == "admin";
      }

      let moderator = false;
      if (user) {
        moderator = user.role == "moderator";
      }

      res.send({ admin, moderator });
    });

    // make an user admin or moderator by existing verified admin
    app.patch("/api/v1/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      if (
        req.body.role &&
        (req.body.role === "admin" || req.body.role === "moderator")
      ) {
        const updatedDoc = {
          $set: {
            role: req.body.role,
          },
        };
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    });

    // get all products based on owner
    app.get("/api/v1/user/products", verifyToken, async (req, res) => {
      const owner = req.query.owner;
      const query = { owner: owner };
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });

    // confirm server connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Nexify server is running...");
});

app.listen(port, () => {
  console.log(`Nexify server is running on port: ${port}`);
});
