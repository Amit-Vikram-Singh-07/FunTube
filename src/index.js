//require('dotenv').config({path:'./env'}) // it's breaking the consistency of the code.

import connectDB from "./db/index.js";
import app from "./app.js";
import dotenv from "dotenv";
dotenv.config({path:'./.env'});

const PORT = process.env.PORT || 8000;
// connecting DB
connectDB()
.then(()=>{
  app.on("Error",(error)=>{
    console.log("Some error occoured before listening the app : ", error);
    throw error;
  })
  app.listen(PORT,()=>{
    console.log(`App is listening at PORT : ${PORT}.`)
  })
})
.catch((error)=>{
   console.log("Some error occoured after MONGO DB connection : ", error);
   throw(error);
});



/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants";


// Initialize Express app
import express from "express";
const app = express();

// Connect to MongoDB database
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

    app.on("Error",(error)=>{
      console.log("Some error occoured in app : ", error);
      throw error;
    })
    app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port : ${process.env.PORT}`);
    })
  } catch (error) {
    console.log("Some error occoured in DB connection : ", error);
    throw error;
  }
})();
*/
