import { Request, Response, NextFunction } from "express";

// export default (req: Request, res: Response, next: NextFunction) => {
//   if (!req.user) {
//     return res.status(401).send({ error: "You must log in!" });
//   }

//   next();
// };

export default (req: Request, res: Response, next: NextFunction) => {
  next();
};
