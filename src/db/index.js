
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


 const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    // console.log(connectionInstance);
    console.log(`MONGO_DB connected!! :: DB Host: ${connectionInstance.connection.host}`)
  } catch (error) {
    console.log("Some error occoured in DB connection : ", error);
    // throw error;
    process.exit(1); // non-zero num represent abnormal termination.
  }
};

export default connectDB;