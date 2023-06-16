import { Request, Response, Application, Router } from "express";
import requireLogin from "../middlewares/requireLogin";
import { createClient } from "redis";
import { Blog } from "../models/Blog";
import { clearHash } from "../services/cache";
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
  user?: {
    id: string;
  };
}

blogRouter.get(
  "/blogs/:id",
  requireLogin,
  async (req: Request, res: Response) => {
    const blog = await Blog.findOne({
      // @ts-ignore
      _user: req.user!.id!,
      _id: req.params.id,
    });

    res.send(blog);
  }
);

blogRouter.get("/blogs", requireLogin, async (req: Request, res: Response) => {
  try {
    // get the event and context objects Lambda receives
    const { event, context } = getCurrentInvoke();
    console.log(event, context);
    // const userId = req.user.id;
    const userId = USERID;
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

    const blogs = await Blog.find({ _user: userId }).cache({
      key: userId,
    });

    return res.send(blogs);
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
  async (req: CustomRequest, res: Response) => {
    const userId = USERID;
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: userId,
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      console.log(err);
      res.status(400).send(err);
    }
  }
);

export default blogRouter;
