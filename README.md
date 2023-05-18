**Auction Serverless & Microservices REST API**

<br/>

## 👉Architecture of the Auction API

The use case for this implementation is uploading a listing agreement, which is a document with heavy payload that outlines the terms and conditions of a real estate transaction.<br/>
<img src="readmeimages/serverless.png" height=500 width=1000>

## 👉Architecture of Message Queue

Decoupled sending emails to users improving fault tolerance. <br/>

<img src="readmeimages/SQS.png" height=300 width=1000>

## 👉Architecture of Streaming Order Receipts

Improved customer experiences using lambda streaming technique. <br/>

<img src="readmeimages/getReceipt.png" height=400 width=1000>

## 👉Architecture of Generating QR code for auction details

Decoupled application qr code generation, with event driven architecture reducing latency, and improving scalability using Chreography pattern.<br/>

<img src="readmeimages/qrcode.png" height=400 width=1000>

## 👉Architecture of Managed Store Checkout flow using step functions

A Managed Store Checkout flow using AWS Step Functions is a system designed to manage the checkout process for an auction payment using orchestrator pattern. <br/>

<img src="readmeimages/stepfunctions.png" height=400 width=1000>
<img src="readmeimages/stepfunctions2.png" height=400 width=1000>

## 👉Architecture of implementing WAF and Cloudfront on Auction service functions

When implementing an auction service, it is important to ensure that the service is secure and highly available. One way to achieve this is by using AWS WAF (Web Application Firewall) and Amazon CloudFront together. <br/>

<img src="readmeimages/waf.png" height=400 width=1000>

<!-- 👉Architecture of implementing Upload Listing Agreement<br/> -->

## 👉Architecture of implementing Upload Listing Agreement

The use case for this implementation is uploading a listing agreement, which is a document with heavy payload that outlines the terms and conditions of a real estate transaction.<br/>

<img src="readmeimages/largePayload.png" height=400 width=1000>

## 👉Architecture of implementing Notes Service for Sellers

Note-taking system for sellers in the admin panel using Cognito authentication, CI/CD with github actions and tested with jest
<img src="readmeimages/notes.png" height=400 width=1000>
<img src="readmeimages/authentication.png" height=400 width=1000>

## 👉Architecture of Decoupling with SQS to imrpove usability

Tight coupling between our resources and dependency on external API can cause bottleneck. To avoid delays I have introduced decoupling with queue and later send socket event to client. Edge cases messages that cannot be processed will be send to DLQ.
<img src="readmeimages/decoupling.png" height=400 width=1000>
<img src="readmeimages/websockets.png" height=200 width=600>

## 👉Architecture of Serverless Log Archive

Through cloudwatch we can retain log data indefinitely but with a cost. So we will expire data in cloudwatch and stream
that logs into s3 bucket. So in s3 bucket we have lifecycle policy to move data to low cost destination like Glacier. Other services can catalog the data and query it from s3.

<img src="readmeimages/log-archive.png" height=400 width=1000>

## 👉Architecture of RealTime Reporting Error

<img src="readmeimages/error-reporting.png" height=400 width=1000>
Send logs to cloudwatch with context. Cloudwatch metric will have a filter pattern by looking
at the attrbiutes of that JSON payload. Trigger an alarm on specific type of error. Alarm will trigger an SNS topic.
SNS will have lambda subscription that will create a meaningful message and email to admin.
