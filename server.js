const express = require("express");
const cors = require("cors");
const path = require("path");


const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, "public")));
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
    console.log(__dirname);
    // res.send("<h1>API</h1><p>GET /movies</p>");
});

app.get("/api/movies", (req, res) => {
console.log("api/movies called");
    const movies = [
        
        {
            id: 1,
            name: "The Silence of The Lambs",
            director: "Jonathan Demme",
            releaseDate: "February 14, 1991",
            rottenTomato: "Rating on Rotten Tomato: 95%",
            img: "/images/silence-of-the-lambs.jpg"

        },
        {
            id: 2,
            name: "The Shining",
            director: "Stephen King",
            releaseDate: "May 23, 1980",
            rottenTomato: "Rating on Rotten Tomato: 84%",
            img: "/images/theShining.jpg"

        },
        {
            id: 3,
            name: "Orphan",
            director: "Jaume Collet-Serra",
            releaseDate: "July 24, 2009",
            rottenTomato: "Rating on Rotten Tomato: 79%",
            img: "/images/orphan.jpg"

        },
        {
            id: 4,
            name: "Insidious",
            director: "James Wan",
            releaseDate: "April 1, 2011",
            rottenTomato: "Rating on Rotten Tomato: 66%",
            img: "/images/insidious.jpg"

        }
    ];
    res.json(movies);
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

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));




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