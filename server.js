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
        try {
            const uploadPath = path.join(__dirname, "public", "images");
            // Create images directory if it doesn't exist
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
            // Generate unique filename: timestamp-originalname
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
    img: Joi.string()
        .optional()
        .allow("") // Allow empty string for img
        .messages({
            "string.base": "Image path must be a string"
        })
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
const handlePostMovie = async (req, res) => {
    try {
        console.log("POST /api/movies called");
        console.log("Request body:", req.body);
        console.log("Request file:", req.file ? req.file.filename : "No file");
        
        let movieData;
        
        // If there's a file upload (FormData), get data from req.body and req.file
        if (req.file) {
            console.log("File uploaded:", req.file.filename, "Size:", req.file.size);
            movieData = {
                name: req.body.name || req.body.title, // Accept both 'name' and 'title'
                description: req.body.description,
                img: `/images/${req.file.filename}` // Path to uploaded file
            };
            console.log("Movie data with image:", movieData);
        } else {
            console.log("No file uploaded, using JSON body");
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
        // Safely get the next ID
        let nextId = 1;
        if (movies.length > 0) {
            const maxId = Math.max(...movies.map(m => (m && m.id) ? m.id : 0));
            nextId = maxId + 1;
        }
        
        const newMovie = {
            id: nextId,
            title: value.name || value.title || "", // Store as 'title' to match GET response format
            description: value.description || "",
            img: movieData.img || "" // Use uploaded image path or empty string
        };
        
        // Add to movies array
        movies.push(newMovie);
        
        console.log("New movie added:", newMovie);
        
        // Return created movie with 201 status
        return res.status(200).json(newMovie);
        
    } catch (err) {
        console.error("Error in POST /api/movies:", err);
        console.error("Stack trace:", err.stack);
        
        // Ensure we haven't already sent a response
        if (!res.headersSent) {
            return res.status(500).json({
                error: "Internal server error",
                message: err.message || "An unexpected error occurred"
            });
        }
    }
};

// POST new movie - handles both JSON and FormData with file upload
// Support both with and without trailing slash
app.post("/api/movies/", upload.single("img"), handlePostMovie);
app.post("/api/movies", upload.single("img"), handlePostMovie);

// Error handling middleware for multer (file upload errors)
// This must come BEFORE the 404 handler but AFTER routes
app.use((err, req, res, next) => {
    // Don't try to send a response if headers have already been sent
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

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Promise Rejection:", err);
    // Don't exit the process, just log it
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    // Give the process a chance to log the error before exiting
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

const server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`GET endpoint: http://localhost:${PORT}/api/movies`);
    console.log(`POST endpoint: http://localhost:${PORT}/api/movies/`);
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
    } else {
        console.error("Server error:", err);
    }
    process.exit(1);
});
