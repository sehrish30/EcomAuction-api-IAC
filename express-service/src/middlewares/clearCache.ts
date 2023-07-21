import { clearHash } from "../services/cache";
import { NextFunction, Request, Response } from "express";
const USERID = "64771fef1796d52930fee186";

const deleteCacheForKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // dumb the cache only when post request completed
  // let the route handler do everything and after eeceution has completed it will come back here
  // allow route handler to run first
  next();

  // after all done clear cache
  await clearHash(USERID);
};

export default deleteCacheForKey;
