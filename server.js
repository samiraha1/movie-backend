const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Joi = require("joi");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "./public/images/");
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });

const upload = multer({ storage: storage });

mongoose
  .connect("mongodb+srv://sakilianderson_db_user:aDPQCwLPx61XqWJz@storeafilm.o09kswu.mongodb.net/y")
  .then(() => {
    console.log("connected to mongodb");
  })
  .catch((error) => {
    console.log("couldn't connect to mongodb", error);
  });

const blogSchema = new mongoose.Schema({
    name:String,
    description:String,
    main_image:String,
    features:[String]
});

const Blog = mongoose.model("Blog", blogSchema);

const validateBlog = (blog) => {
    const schema = Joi.object({
        title: Joi.string()
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

    return schema.validate(blog);
};

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
        description:req.body.description
    });

    if(req.file){
        blog.main_image = `/images/${req.file.filename}`;
    }

    const newBlog = await blog.save();
    res.status(200).send(newBlog);
});

app.put("/api/movies/:id", upload.single("img"), async(req, res)=>{
    //console.log(`You are trying to edit ${req.params.id}`);
    //console.log(req.body);
    const isValidUpdate = validateBlog(req.body);

    if(isValidUpdate.error){
        console.log("Invalid Info");
        res.status(400).send(isValidUpdate.error.details[0].message);
        return;
    }

    const fieldsToUpdate = {
        title : req.body.title,
        description : req.body.description
    }
    
    if(req.file){
        fieldsToUpdate.main_image = `/images/${req.file.filename}`;
    }

    const success = await Blog.updateOne({_id:req.params.id}, fieldsToUpdate);

    if(success.matchedCount === 0){
        res.status(404).send("We couldn't locate the movie to edit");
        return;
    }

    const blog = await Blog.findById(req.params.id);
    res.status(200).send(blog);

});

app.delete("/api/movies/:id", async(req,res)=>{
    const blog = await Blog.findByIdAndDelete(req.params.id);
    
    if(!blog){
        res.status(404).send("We couldn't locate the movie to delete");
        return;
    }

    res.status(200).send(blog);
});

app.listen(PORT, ()=>{
    console.log(`Server listening on port ${PORT}`);
});
