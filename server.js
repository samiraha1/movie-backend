const express = require("express");
const cors = require("cors");
const path = require("path");
const Joi = require("joi");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3001;

mongoose
  .connect("mongodb+srv://sakilianderson_db_user:5HZ3ccVw26WnrOnL@storeafilm.o09kswu.mongodb.net/storeafilm?retryWrites=true&w=majority")
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((error) => {
    console.log("couldn't connect to mongodb", error);
  });

const movieSchema = new mongoose.Schema({
  name: String,
  description: String,
  img: String
});

const Movie = mongoose.model("Movie", movieSchema);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            const uploadPath = path.join(__dirname, "public", "images");
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        } catch (err) {
            console.error("Error creating upload directory:", err);
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        try {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, file.fieldname + "-" + uniqueSuffix + ext);
        } catch (err) {
            console.error("Error generating filename:", err);
            cb(err);
        }
    }
});

const upload = multer({
    storage: storage,
    limits: {
    fileSize: 5 * 1024 * 1024 
    },
    fileFilter: (req, file, cb) => {
        if (!file) {
            return cb(null, true);
        }
        
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
        }
    }
});

const validateMovie = (movie) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(1)
      .max(200)
      .required()
      .messages({
        "string.empty": "Title is required",
        "string.min": "Title must be at least 1 character",
        "string.max": "Title must be no more than 200 characters",
        "any.required": "Title is required"
      }),
    description: Joi.string()
      .min(1)
      .max(2000)
      .required()
      .messages({
        "string.empty": "Description is required",
        "string.min": "Description must be at least 1 character",
        "string.max": "Description must be no more than 2000 characters",
        "any.required": "Description is required"
      }),
    img: Joi.string()
      .optional()
      .allow("")
      .messages({
        "string.base": "Image path must be a string"
      })
  });
  return schema.validate(movie);
};

app.get("/api/movies", async (req, res) => {
  const movies = await Movie.find();
  res.send(movies);
});

app.post("/api/movies", upload.single("img"), async (req, res) => {
  console.log(req.body);
  const isValidMovie = validateMovie(req.body);

  if (isValidMovie.error) {
    console.log("Invalid movie");
    res.status(400).send(isValidMovie.error.details[0].message);
    return;
  }

  const movie = new Movie({
    name: req.body.name,
    description: req.body.description
  });

  if (req.file) {
    movie.img = `/images/${req.file.filename}`;
  }

  const newMovie = await movie.save();
  res.status(200).send(newMovie);
});

app.put("/api/movies/:id", upload.single("img"), async (req, res) => {
  const isValidUpdate = validateMovie(req.body);

  if (isValidUpdate.error) {
    console.log("Invalid Info");
    res.status(400).send(isValidUpdate.error.details[0].message);
    return;
  }

  const fieldsToUpdate = {
    name: req.body.name,
    description: req.body.description
  };

  if (req.file) {
    fieldsToUpdate.img = `/images/${req.file.filename}`;
  }

  const success = await Movie.updateOne({ _id: req.params.id }, fieldsToUpdate);

  if (success.matchedCount === 0) {
    res.status(404).send("We couldn't locate the movie to edit");
    return;
  }

  const movie = await Movie.findById(req.params.id);
  res.status(200).send(movie);
});

app.delete("/api/movies/:id", async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);

  if (!movie) {
    res.status(404).send("We couldn't locate the movie to delete");
    return;
  }

  res.status(200).send(movie);
});

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
  console.log(__dirname);
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is running!", timestamp: new Date().toISOString() });
});

app.get("/api/test-routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    }
  });
  res.json({ 
    message: "Registered routes", 
    routes: routes.filter(r => r.path.includes('/api/movies')),
    totalRoutes: routes.length
  });
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        console.error("Error occurred but response already sent:", err.message);
        return next(err);
    }
    
    console.error("Error middleware caught:", err.message);
    console.error("Error stack:", err.stack);
    
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                error: "File too large",
                message: "Image size must be less than 5MB"
            });
        }
        return res.status(400).json({
            error: "File upload error",
            message: err.message
        });
    }
    
    if (err) {
        return res.status(400).json({
            error: "Validation error",
            message: err.message
        });
    }
    
    next();
});

app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        message: `${req.method} ${req.path} is not defined`
    });
});

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

const server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`GET endpoint: http://localhost:${PORT}/api/movies`);
  console.log(`POST endpoint: http://localhost:${PORT}/api/movies`);
    console.log(`PUT endpoint: http://localhost:${PORT}/api/movies/:id`);
    console.log(`DELETE endpoint: http://localhost:${PORT}/api/movies/:id`);
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
    } else {
        console.error("Server error:", err);
    }
    process.exit(1);
});