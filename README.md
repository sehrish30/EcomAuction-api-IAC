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

Note-taking system for sellers in the admin panel
<img src="readmeimages/notes.png" height=400 width=1000>
