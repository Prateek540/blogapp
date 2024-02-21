const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, res, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploadMiddleware = multer({ storage });

const bcryptjs = require("bcryptjs");
const salt = bcryptjs.genSaltSync(10);
const jwt = require("jsonwebtoken");
const User = require("../api/models/User");
const Post = require("../api/models/Post");

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname));

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to Mongo");
  })
  .catch((error) => {
    console.log(error);
  });

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcryptjs.hashSync(password, salt),
    });
    jwt.sign(
      { username, id: userDoc._id },
      process.env.SECRET,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie("token", token).json({
          id: userDoc._id,
          username,
        });
      }
    );
  } catch (e) {
    res.status(400).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const passOk = bcryptjs.compareSync(password, userDoc?.password);
  if (passOk) {
    //logged in
    jwt.sign(
      { username, id: userDoc._id },
      process.env.SECRET,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie("token", token).json({
          id: userDoc._id,
          username,
        });
      }
    );
  } else {
    res.status(400).json("Wrong username or password");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, process.env.SECRET, {}, (err, info) => {
    if (err) return res.json(null);
    res.json(info);
  });
});

app.post("/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

app.post("/post", uploadMiddleware.single("files"), async (req, res) => {
  const { title, summary, content } = req.body;
  const { path } = req.file;
  const { token } = req.cookies;
  jwt.verify(token, process.env.SECRET, {}, async (err, info) => {
    if (err) throw err;
    const newPost = new Post({
      title,
      summary,
      content,
      cover: path,
      author: info.id,
    });
    const saved = await newPost.save();
    if (saved) res.json(newPost);
    else res.status(400).json("Cannot create post now.");
  });
});

app.get("/post", async (req, res) => {
  const posts = await Post.find()
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(posts);
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const newPost = await Post.findById(id).populate("author", ["username"]);
  res.json(newPost);
});

app.put("/post/:id", uploadMiddleware.single("files"), async (req, res) => {
  let path = null;
  if (req.file) {
    path = req.file.path;
  }
  const { token } = req.cookies;
  jwt.verify(token, process.env.SECRET, {}, async (err, info) => {
    if (err) throw err;
    const { id, title, summary, content } = req.body;
    const postDoc = await Post.findById(id);
    const updated = await postDoc.updateOne({
      title,
      summary,
      content,
      cover: path ? path : postDoc.cover,
    });
    if (updated) res.json(postDoc);
    else res.status(400).json("Cannot update post now.");
  });
});

app.listen(8000, () => {
  console.log("Server running on port 8000");
});
