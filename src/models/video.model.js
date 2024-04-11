import { mongoose, Schema } from "mongoose";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // cloudnary url for accessing the image or video. it also give duration
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    videoFile: {
      type: String, // cloudnary url for accessing the image or video
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    thumbnail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);


videoSchema.plugin(aggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);
