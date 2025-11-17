const express = require("express");
const cors = require("cors");
const path = require("path");
const Joi = require("joi");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "public", "images");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
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
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
    console.log(__dirname);
});

app.get("/api/movies", (req, res) => {
    console.log("GET /api/movies called");
    res.json(movies);
});

const handlePostMovie = (req, res) => {
    console.log("POST /api/movies called");
    
    try {
        let movieData;
        
        if (req.file) {
            movieData = {
                name: req.body.name || req.body.title, // Accept both 'name' and 'title'
                description: req.body.description,
                img: `/images/${req.file.filename}` // Path to uploaded file
            };
        } else {
            movieData = req.body;
        }
        
        const { error, value } = movieSchema.validate(movieData, { abortEarly: false });
        
        if (error) {
            const errorMessages = error.details.map(detail => detail.message).join(", ");
            return res.status(400).json({
                error: "Validation error",
                message: errorMessages,
                details: error.details
            });
        }
        
        const newMovie = {
            id: movies.length > 0 ? Math.max(...movies.map(m => m.id)) + 1 : 1,
            title: value.name, 
            description: value.description,
            img: movieData.img || "" 
        };
        
        movies.push(newMovie);
        
        console.log("New movie added:", newMovie);
        
        res.status(201).json(newMovie);
        
    } catch (err) {
        console.error("Error in POST /api/movies:", err);
        res.status(500).json({
            error: "Internal server error",
            message: err.message
        });
    }
};

app.post("/api/movies/", upload.single("img"), handlePostMovie);
app.post("/api/movies", upload.single("img"), handlePostMovie);

app.use((err, req, res, next) => {
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