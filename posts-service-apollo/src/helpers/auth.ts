import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import serviceAccount from "../../config/fbServiceAccountKey.json" assert { type: "json" };

initializeApp({
  credential: cert(serviceAccount as any),
});
// graphql req.headers auth logic
export const authCheck = async (token: any) => {
  if (token) {
    // check validatiy of token
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      const email = decodedToken.email;
      return email;
    } catch (err) {
      throw new Error(err.message);
    }
  } else {
    throw new Error("Unauthorized");
  }
};

export const tokenIsNotValid = async (token: string) => {
  if (token) {
    // check validatiy of token
    try {
      console.log("TOKEN", token)
      const decodedToken = await getAuth().verifyIdToken(token);
      const email = decodedToken.email;
      return false;
    } catch (err) {
      console.log(err);
      return true;
    }
  } else {
    return true;
  }
};

export const authCheckREST = async (req, res, next) => {
  try {
    if (req.headers.token) {
      await getAuth().verifyIdToken(req.headers.token);
      next();
    }
  } catch (err) {
    return res.status(403).json({
      err,
    });
  }
};
