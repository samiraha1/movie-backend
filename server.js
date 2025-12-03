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
  .connect("mongodb+srv://sakilianderson_db_user:5HZ3ccVw26WnrOnL@storeafilm.o09kswu.mongodb.net/")
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((error) => {
    console.log("couldn't connect to mongodb", error);
  });

const blogSchema = new mongoose.Schema({
    title:String,
    description:String,
    main_image:String,
    features:[String]
});

const Blog = mongoose.model("Blog", blogSchema);

app.get("/api/movies",async(req, res)=>{
    const blogs = await Blog.find();
    res.send(blogs);
});


app.post("/api/movies", upload.single("img") , async(req, res)=>{
    console.log(req.body);
    const isValidBlog = validateBlog(req.body);

    if(isValidBlog.error){
        console.log("Invalid blog");
        res.status(400).send(isValidBlog.error.details[0].message);
        return;
    }

    const blog = new Blog({
        title:req.body.title,
        description:req.body.description,
        features: req.body.features.split(",")
    });

    if(req.file){
        blog.main_image = req.file.filename;
    }

    const newBlog = await blog.save();
    res.status(200).send(newBlog);
});

app.put("/api/movies/:id", upload.single("img"), async(req, res)=>{
    const isValidUpdate = validateBlog(req.body);

    if(isValidUpdate.error){
        console.log("Invalid Info");
        res.status(400).send(isValidUpdate.error.details[0].message);
        return;
    }

    const fieldsToUpdate = {
        title : req.body.title,
        description : req.body.description,
        features: req.body.features.split(",")
    }
    
    if(req.file){
        fieldsToUpdate.main_image = req.file.filename;
    }

    const success = await Blog.updateOne({_id:req.params.id}, fieldsToUpdate);

    if(!success){
        res.status(404).send("We couldn't locate the ouse to edit");
        return;
    }

    const blog = await Blog.findById(req.params.id);
    res.status(200).send(blog);

});

app.delete("/api/houses/:id", async(req,res)=>{
    const blog = await Blog.findByIdAndDelete(req.params.id);
    
    if(!blog){
        res.status(404).send("We couldn't locate the house to delete");
        return;
    }

    res.status(200).send(blog);
});



app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

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

<<<<<<< HEAD
// let movies = [
//     {
//         id: 1,
//         title: "New Demon Slayer Movie",
//         description: "This movie was so good. I definitely recommend...",
//         img: "/images/demon-slayer.png"
//     },
//     {
//         id: 2,
//         title: "Negative Reviews on the movie 'Him'",
//         description: "There have been lots of opinions on the new Him movie...",
//         img: "/images/him.jpg"
//     },
// ];
=======
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
>>>>>>> a21fa0286955e695e0231e305837b49300193d48

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
<<<<<<< HEAD
        .allow("") 
=======
        .allow("")
>>>>>>> a21fa0286955e695e0231e305837b49300193d48
        .messages({
            "string.base": "Image path must be a string"
        })
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
    console.log(__dirname);
});

app.get("/api/movies", (req, res) => {
    console.log("GET /api/movies called");
    res.json(movies);
});

app.get("/api/test", (req, res) => {
    res.json({ message: "Backend is running!", timestamp: new Date().toISOString() });
});

<<<<<<< HEAD
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

=======
>>>>>>> a21fa0286955e695e0231e305837b49300193d48
const handlePostMovie = async (req, res) => {
    try {
        console.log("POST /api/movies called");
        console.log("Request body:", req.body);
        console.log("Request file:", req.file ? req.file.filename : "No file");
        
        let movieData;
        
        if (req.file) {
            console.log("File uploaded:", req.file.filename, "Size:", req.file.size);
            movieData = {
                name: req.body.name || req.body.title, 
                description: req.body.description,
                img: `/images/${req.file.filename}` 
            };
            console.log("Movie data with image:", movieData);
        } else {
            console.log("No file uploaded, using JSON body");
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
        
<<<<<<< HEAD
        
=======
>>>>>>> a21fa0286955e695e0231e305837b49300193d48
        let nextId = 1;
        if (movies.length > 0) {
            const maxId = Math.max(...movies.map(m => (m && m.id) ? m.id : 0));
            nextId = maxId + 1;
        }
        
        const newMovie = {
            id: nextId,
            title: value.name || value.title || "", 
            description: value.description || "",
            img: movieData.img || "" 
        };
        
        movies.push(newMovie);
        
        console.log("New movie added:", newMovie);
        
        return res.status(201).json(newMovie);
        
    } catch (err) {
        console.error("Error in POST /api/movies:", err);
        console.error("Stack trace:", err.stack);
        
        if (!res.headersSent) {
            return res.status(500).json({
                error: "Internal server error",
                message: err.message || "An unexpected error occurred"
            });
        }
    }
};

<<<<<<< HEAD

=======
>>>>>>> a21fa0286955e695e0231e305837b49300193d48
app.post("/api/movies/", upload.single("img"), handlePostMovie);
app.post("/api/movies", upload.single("img"), handlePostMovie);

const handlePutMovie = async (req, res) => {
    try {
        const movieId = parseInt(req.params.id);
        console.log(`PUT /api/movies/${movieId} called`);
        console.log("Request body:", req.body);
        console.log("Request file:", req.file ? req.file.filename : "No file");
        
        const movieIndex = movies.findIndex(m => m && m.id === movieId);
        
        if (movieIndex === -1) {
            return res.status(404).json({
                error: "Movie not found",
                message: `Movie with ID ${movieId} does not exist`
            });
        }
        
        let movieData;
        const existingImg = movies[movieIndex].img || "";
        
        if (req.file) {
            console.log("File uploaded:", req.file.filename, "Size:", req.file.size);
            movieData = {
                name: req.body.name || req.body.title, 
                description: req.body.description,
                img: `/images/${req.file.filename}` 
            };
            console.log("Movie data with image:", movieData);
        } else {
            console.log("No file uploaded, using existing image or body data");
            const providedImg = req.body.img;
            movieData = {
                name: req.body.name || req.body.title,
                description: req.body.description,
                img: (providedImg !== undefined && providedImg !== "") ? providedImg : existingImg 
            };
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
        
        const updatedMovie = {
            id: movieId,
            title: value.name || value.title || "", 
            description: value.description || "",
            img: movieData.img || existingImg 
        };
        
        movies[movieIndex] = updatedMovie;
        
        console.log("Movie updated:", updatedMovie);
        
        return res.status(200).json(updatedMovie);
        
    } catch (err) {
        console.error("Error in PUT /api/movies/:id:", err);
        console.error("Stack trace:", err.stack);
        
        if (!res.headersSent) {
            return res.status(500).json({
                error: "Internal server error",
                message: err.message || "An unexpected error occurred"
            });
        }
    }
};

const handleDeleteMovie = async (req, res) => {
    try {
        const movieId = parseInt(req.params.id);
        console.log(`DELETE /api/movies/${movieId} called`);
        
        const movieIndex = movies.findIndex(m => m && m.id === movieId);
        
        if (movieIndex === -1) {
            return res.status(404).json({
                error: "Movie not found",
                message: `Movie with ID ${movieId} does not exist`
            });
        }
        
        const deletedMovie = movies[movieIndex];
        
        movies.splice(movieIndex, 1);
        
        console.log("Movie deleted:", deletedMovie);
        
<<<<<<< HEAD
       
        return res.status(200).json({
=======
         return res.status(200).json({
>>>>>>> a21fa0286955e695e0231e305837b49300193d48
            message: "Movie deleted successfully",
            deletedMovie: deletedMovie
        });
        
    } catch (err) {
        console.error("Error in DELETE /api/movies/:id:", err);
        console.error("Stack trace:", err.stack);
        
        if (!res.headersSent) {
            return res.status(500).json({
                error: "Internal server error",
                message: err.message || "An unexpected error occurred"
            });
        }
    }
};

app.put("/api/movies/:id", upload.single("img"), handlePutMovie);
app.put("/api/movies/:id/", upload.single("img"), handlePutMovie);

app.delete("/api/movies/:id", handleDeleteMovie);
app.delete("/api/movies/:id/", handleDeleteMovie);

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
    console.log(`POST endpoint: http://localhost:${PORT}/api/movies/`);
<<<<<<< HEAD
    console.log(`PUT endpoint: http://localhost:${PORT}/api/movies/:id`);
    console.log(`DELETE endpoint: http://localhost:${PORT}/api/movies/:id`);
=======
        console.log(`PUT endpoint: http://localhost:${PORT}/api/movies/:id`);
    console.log(`DELETE endpoint: http://localhost:${PORT}/api/movies/:id`);

>>>>>>> a21fa0286955e695e0231e305837b49300193d48
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
    } else {
        console.error("Server error:", err);
    }
    process.exit(1);
});
