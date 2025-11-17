const express = require("express");
const cors = require("cors");
const path = require("path");
const Joi = require("joi");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For FormData parsing (multer handles it, but good to have)

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "public", "images");
        // Create images directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Only validate if a file is provided (file upload is optional)
        if (!file) {
            return cb(null, true);
        }
        
        // Accept only image files
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

// Movies array - in-memory storage (you can convert to database later)
let movies = [
    {
        id: 1,
        title: "New Demon Slayer Movie",
        description: "This movie was so good. I definitely recommend...",
        img: "/images/demon-slayer.png"
    },
    {
        id: 2,
        title: "Negative Reviews on the movie 'Him'",
        description: "There have been lots of opinions on the new Him movie...",
        img: "/images/him.jpg"
    },
];

// Joi validation schema - MUST MATCH frontend VALIDATION_RULES
const movieSchema = Joi.object({
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
    // img is optional for file uploads, handled separately
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
    console.log(__dirname);
});

// GET all movies
app.get("/api/movies", (req, res) => {
    console.log("GET /api/movies called");
    res.json(movies);
});

// Test endpoint to verify server is running
app.get("/api/test", (req, res) => {
    res.json({ message: "Backend is running!", timestamp: new Date().toISOString() });
});

// POST handler function - shared for both routes
const handlePostMovie = (req, res) => {
    console.log("POST /api/movies called");
    
    try {
        let movieData;
        
        // If there's a file upload (FormData), get data from req.body and req.file
        if (req.file) {
            movieData = {
                name: req.body.name || req.body.title, // Accept both 'name' and 'title'
                description: req.body.description,
                img: `/images/${req.file.filename}` // Path to uploaded file
            };
        } else {
            // JSON request - data is in req.body
            movieData = req.body;
        }
        
        // Validate with Joi
        const { error, value } = movieSchema.validate(movieData, { abortEarly: false });
        
        if (error) {
            // Return validation errors
            const errorMessages = error.details.map(detail => detail.message).join(", ");
            return res.status(400).json({
                error: "Validation error",
                message: errorMessages,
                details: error.details
            });
        }
        
        // Create new movie object
        const newMovie = {
            id: movies.length > 0 ? Math.max(...movies.map(m => m.id)) + 1 : 1,
            title: value.name, // Store as 'title' to match GET response format
            description: value.description,
            img: movieData.img || "" // Use uploaded image path or empty string
        };
        
        // Add to movies array
        movies.push(newMovie);
        
        console.log("New movie added:", newMovie);
        
        // Return created movie with 201 status
        res.status(201).json(newMovie);
        
    } catch (err) {
        console.error("Error in POST /api/movies:", err);
        res.status(500).json({
            error: "Internal server error",
            message: err.message
        });
    }
};

// POST new movie - handles both JSON and FormData with file upload
// Support both with and without trailing slash
app.post("/api/movies/", upload.single("img"), handlePostMovie);
app.post("/api/movies", upload.single("img"), handlePostMovie);

// Error handling middleware for multer (file upload errors)
// This must come BEFORE the 404 handler but AFTER routes
app.use((err, req, res, next) => {
    console.error("Error middleware caught:", err.message);
    
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
    
    // Handle other errors (like validation errors from multer fileFilter)
    if (err) {
        return res.status(400).json({
            error: "Validation error",
            message: err.message
        });
    }
    
    next();
});

// Handle 404 for undefined routes
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        message: `${req.method} ${req.path} is not defined`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`GET endpoint: http://localhost:${PORT}/api/movies`);
    console.log(`POST endpoint: http://localhost:${PORT}/api/movies/`);
});



// app.get("/movies", (req, res) => {
//     try {
//         console.log("current movie: ", movies);
//         res.json(movies);
//     } catch (err) {
//         console.error("Error in /movies:", err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });

// app.use((err, req, res, next) => {
//     console.error("Unhandled error:", err);
//     res.status(500).json({ error: "Internal server error" });
// });




//import cors from "cors";
// import express from "express";

// // const express = require("express");
// const app = express();
// app.use(express.static("public"));

// // app.get('/', (req, res) => {
// //     res.sendFile(__dirname + "/index.html");
// // });
// app.use(cors());
// app.get("/api/movies", (req, res) => {
//     const movies = [
//         {
//             name: "The Silence of The Lambs",
//             director: "Jonathan Demme",
//             releaseDate: "February 14, 1991",
//             rottenTomato: "Rating on Rotten Tomato: 95%",
//             img: "images/silence of the lambs.jpg"

//         },
//         {
//             name: "The Shining",
//             director: "Stephen King",
//             releaseDate: "May 23, 1980",
//             rottenTomato: "Rating on Rotten Tomato: 84%",
//             img: "images/theShining.jpg"

//         },
//         {
//             name: "Orphan",
//             director: "Jaume Collet-Serra",
//             releaseDate: "July 24, 2009",
//             rottenTomato: "Rating on Rotten Tomato: 79%",
//             img: "images/orphan.jpg"

//         },
//         {
//             name: "Insidious",
//             director: "James Wan",
//             releaseDate: "April 1, 2011",
//             rottenTomato: "Rating on Rotten Tomato: 66%",
//             img: "images/insidious.jpg"

//         }]
//     res.send(movies);
// });
// app.get("/movies", (req, res) => {
//     res.json(movies);
// })
// app.listen(3000, () => {
//     console.log("im listening");
// });