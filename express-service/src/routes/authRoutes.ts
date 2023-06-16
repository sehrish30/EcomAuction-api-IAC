import { Request, Response, Application, Router } from "express";
import passport from "passport";

const authRouter = Router();

authRouter.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

authRouter.get(
  "/auth/google/callback",
  passport.authenticate("google"),
  (req: Request, res: Response) => {
    res.redirect("/blogs");
  }
);

authRouter.get("/auth/logout", (req: Request, res: Response) => {
  req.logout(() => {});
  res.redirect("/");
});

authRouter.get("/api/current_user", async (req: Request, res: Response) => {
  res.send(req.user);
});

export default authRouter;
