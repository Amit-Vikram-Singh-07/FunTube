import mongoose,{Schema} from "mongoose";

const likeSchema = new Schema({
      video:{
        type: Schema.Types.ObjectId,
        ref:"Video",
        required:true,
      },
      likedBy:{
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true,
      },
      comment:{
        type: Schema.Types.ObjectId,
        ref:"Comment",
        required:true,
      },
      tweet:{
        type: Schema.Types.ObjectId,
        ref:"Tweet",
        required:true,
      },
},{ timestamps: true });

export const Like = new mongoose.model("Like",likeSchema);