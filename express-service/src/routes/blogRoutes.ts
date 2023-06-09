import { Request, Response, Application, Router } from "express";
import requireLogin from "../middlewares/requireLogin";
import { createClient } from "redis";
import { Blog } from "../models/Blog";
import { clearHash, clearSingleHash } from "../services/cache";
import deleteCacheForKey from "../middlewares/clearCache";
import { getCurrentInvoke } from "@vendia/serverless-express";

const USERID = "64771fef1796d52930fee186";
const redisClient = createClient();

const blogRouter = Router();

redisClient.on("error", (err) => console.log("Redis Client Error", err));
//{
//   url: "redis://127.0.0.1:6379",
// }
// const redisUrl = "redis[s]://[[username][:password]@][host]:6379[/db-number]";
// const Blog = mongoose.model("Blog");

interface CustomRequest extends Request {
  user: {
    id: string;
  };
}

blogRouter.get(
  "/blogs/:id",
  requireLogin,
  async (req: Request, res: Response) => {
    const userId = USERID;
    try {
      const blog = await Blog.findOne({
        _user: userId,
        _id: req.params.id,
      }).stringCache();

      return res.send(blog);
    } catch (err) {
      console.log(err);
      return res.status(500).json(err);
    }
  }
);

blogRouter.get("/blogs", requireLogin, async (req: Request, res: Response) => {
  try {
    // get the event and context objects Lambda receives
    const { event, context } = getCurrentInvoke();
    console.log(event, context);
    // const userId = req.user.id;
    const userId = USERID;

    const blogs = await Blog.find({ _user: userId }).cache({
      key: userId,
    });

    // always return when you are using serverless express app
    // it will exit lambda function
    return res.send(blogs);
    // await redisClient.connect();
    // // const userId = req.user.id
    // const userId = USERID;
    // // first check if we have any data in our cache server in redis
    // const cachedBlogs = await redisClient.get(userId);

    // // if yes, then return to the req right away and return
    // if (cachedBlogs) {
    //   console.log("SERVING FROM CACHE");
    //   await redisClient.disconnect();
    //   //cachedBlogs is stringified by redis
    //   return res.send(JSON.parse(cachedBlogs));
    // }

    // // if no, we need to respond to request and update our cache
    // // to store the data
    // const blogs = await Blog.find({ _user: userId });

    // // key and value
    // redisClient.set(userId, JSON.stringify(blogs));

    // console.log("SERVING FROM MONGODB");
    // await redisClient.disconnect();
  } catch (err) {
    console.log(err);
    await redisClient.disconnect();
    return res.status(500).json(err);
  }
});

blogRouter.post(
  "/blogs",
  requireLogin,
  deleteCacheForKey,
  async (req: Request, res: Response) => {
    const userId = USERID;
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: userId,
    });

    try {
      await blog.save();
      await clearHash(userId);
      // always return when you are using serverless express app
      // it will exit lambda function
      return res.send(blog);
    } catch (err) {
      console.log(err);
      return res.status(400).send(err);
    }
  }
);

blogRouter.put(
  "/blog/:id",
  requireLogin,
  deleteCacheForKey,
  async (req: Request, res: Response) => {
    const userId = USERID;
    const { title, content } = req.body;
    const { id } = req.params;

    const blog = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        content,
      },
      {
        new: true,
      }
    );

    const key = {
      _user: userId,
      _id: id,
    };

    try {
      await clearSingleHash(key);
      // always return when you are using serverless express app
      // it will exit lambda function
      return res.send(blog);
    } catch (err) {
      console.log(err);
      return res.status(400).send(err);
    }
  }
);

export default blogRouter;
