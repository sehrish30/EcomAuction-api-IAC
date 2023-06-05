"use strict";

import { APIGatewayEvent } from "aws-lambda";
import { uploadPictureToS3 } from "../lib/uploadPictureToS3";
import { getAuctionById } from "./getAuction";
import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import createError from "http-errors";
import validator from "@middy/validator";
import uploadAuctionPictureSchema from "../lib/schemas/uploadAuctionPictureSchema";
import { setAuctionPictureUrl } from "../lib/setAuctionPictureUrl";
import { transpileSchema } from "@middy/validator/transpile";
import cors from "@middy/http-cors";

export async function uploadAuctionPicture(event:APIGatewayEvent) {
  // retrieve the auction id
  // check auction exists
  // assign the url to the image of the auction
  // way we give picture data is using base64 string
  // u can use binary, multipart, signed s3 urls
  //   console.log(event.pathParameters.id);
  const { id } = event.pathParameters as {id: string};

  // get it from authorizer claims - lambda authorizer
  const { email } = event.requestContext.authorizer as {email: string};

 
  // passed base 64 image strainght into body
  // sometimes base64 can be difficult to handler
  // can be a bit corrupted
  // for this reason we need strip off some characters with rules like
  // base64 only allowed alphanumeric characters
  // base64 string always ends with an equal sign
  const base64String = event.body?.replace(/^data:image\/\w+;base64,/, "") as string;
  // Creates a Buffer containing the dataUrl from frontend
  // When creating a Buffer from a string, 
  // "base64" encoding will also correctly accept "URL and Filename Safe Alphabet
  // Whitespace characters such as spaces, tabs, 
  // and new lines contained within the base64-encoded string are ignored.
  const ourBuffer = Buffer.from(base64String, "base64");

  // also when check in middy middleware validator
  if (ourBuffer.toString("base64") !== base64String) {
    throw new createError.BadRequest(
      "An invalid base64 string was provided for the auction image."
    );
  }

  /**
   * Now create a buffer from this string
   * using that buffer i can upload
   * my picture to s3
   */

  let updatedAuction;
  let pictureTag;
  let auction;
  try {
    auction = await getAuctionById(id);
  } catch (err) {
    console.log(err);
    throw new createError.InternalServerError(err);
  }

  // Validate auction ownership
  if (auction.Seller !== email) {
    throw new createError.Forbidden(`You are not the seller of this auction`);
  }

  try {
    pictureTag = await uploadPictureToS3(`${auction.Id}.jpg`, ourBuffer);
    updatedAuction = await setAuctionPictureUrl(auction.Id, pictureTag);
  } catch (err) {
    console.log(err)
    throw new createError.InternalServerError(err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = middy(uploadAuctionPicture)
  .use(httpErrorHandler())
  .use(
    validator({
      eventSchema: transpileSchema(uploadAuctionPictureSchema),
    })
  )
  .use(cors());
//
// serverless deploy function --function uploadAuctionPicture
// serverless logs -f uploadAuctionPicture --startTime 1h
// serverless invoke -f uploadAuctionPicture -l
