# ECOMAUCTION API

The ECOMAUCTION is an API that enables users to buy and sell products through an online auction system. It allows users to create auctions for their products, set starting prices, and receive bids from potential buyers. The API provides endpoints for users to manage their auctions, including creating, updating, and deleting auctions, as well as placing bids on existing auctions. With this API, users can easily buy and sell products online through an auction-style marketplace.<br/>

1. Serverless Infrastructure development <br/>
   IaC with serverless framework and AWS cdk using typescript.<br/>

2. Microservices Lambda function development <br/>
   Nodejs Lambda functions using aws sdk with javascript v3.<br/>

**Architecture of EcomAuction serverless microservices**

_Synchronous communication with API Gateway. Amazon eventbridge as event bus and SQS as custom queue service using asynchronous communications. Event source mapping to process messages in another service as messages appear in the queue.
Using Queue Chaining, Publish-Subscribe, Fan-out design patterns
._

<img src="readmeimages/layers.png" style="max-width: 100%; height: auto; object-fit: contain;">

| Pattern              | Service              |
| -------------------- | -------------------- |
| Topic-Queue Chaining | SQS                  |
| Load balancing       | SQS                  |
| Event Bus            | Event Bridge         |
| Pub/sub (fan-out)    | SNS                  |
| Orchestration        | Step Functions       |
| API (REST/Graphql)   | AppSync/ API Gateway |
| Event Streams        | Kinesis              |
| Chreography          | Event Bridge         |
| Saga Pattern         | Step functions       |
| Circuit Breaker      | Dynamo DB, Lambda    |

The following are all the usecases covered in the api.

<br/>

## 👉Architecture of the Auction API

Implemented a comprehensive auction service that enables Create, Read, Update, and Delete (CRUD) operations on auctions and middy middleware for input validation. Additionally, leveraged AWS EventBridge schedulers to process expired auctions and automatically trigger notifications to the notifications service. This approach ensures that expired auctions are handled efficiently and that notifications are sent to sellers and buyers in a timely manner. The system was designed with scalability and fault tolerance in mind, ensuring that it can handle large volumes of auctions and events without compromising performance or reliability.

<img src="readmeimages/serverless.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of Message Queue

Decoupled sending emails and other notifications to users improves fault tolerance. By having a notification service that handles all notifications separately, we can ensure that the process of sending notifications doesn't affect the rest of the application. This separation of concerns also allows for better scalability and maintainability of the system, as each service can be developed, tested, and deployed independently.

<img src="readmeimages/SQS.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of Streaming Order Receipts

Used Lambda function urls and Lambda streaming technique to improve customer experiences by reducing application latency and providing partial results in real-time during long-running tasks or queries. <br/>

<img src="readmeimages/getReceipt.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of Generating QR code for auction details

Decoupled application qr code generation, with event driven architecture reducing latency, and improving scalability using Chreography pattern.<br/>

<img src="readmeimages/qrcode.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of Managed Store Checkout flow using step functions

A Managed Store Checkout flow using AWS Step Functions is a system designed to manage the checkout process for an auction payment using orchestrator pattern. <br/>

<img src="readmeimages/stepfunctions.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/stepfunctions2.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of implementing WAF and Cloudfront on Auction service functions

When implementing an auction service, it is important to ensure that the service is secure and highly available. One way to achieve this is by using AWS WAF (Web Application Firewall) and Amazon CloudFront together. <br/>

<img src="readmeimages/waf.png" style="max-width: 100%; height: auto; object-fit: contain;">

<!-- 👉Architecture of implementing Upload Listing Agreement<br/> -->

## 👉Architecture of implementing Upload Listing Agreement

The use case for this implementation is uploading a listing agreement, which is a document with heavy payload that outlines the terms and conditions of a real estate transaction.<br/>

<img src="readmeimages/largePayload.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of implementing Notes Service for Sellers

Developed a note-taking system for sellers in the admin panel, with Cognito authentication for secure access control. The system was integrated with CI/CD using Github Actions, and tested extensively with Jest. Additionally, implemented federated identities for Facebook and Google with Cognito, providing a seamless sign-in experience for users.

<img src="readmeimages/notes.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/authentication.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/github-action-workflows.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of Decoupling with SQS to imrpove usability

Tight coupling between our resources and dependency on external API can cause bottleneck. To avoid delays I have introduced decoupling with queue and later send websocket event using APIGateway websockets to client. Edge cases messages that cannot be processed will be send to DLQ.

<img src="readmeimages/decoupling.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/websockets.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of Serverless Log Archive

Through cloudwatch we can retain log data indefinitely but with a cost. So we will expire data in cloudwatch and stream
that logs into s3 bucket. So in s3 bucket we have lifecycle policy to move data to low cost destination like Glacier. Other services can catalog the data and query it from s3.

<img src="readmeimages/log-archive.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of RealTime Reporting Error

Send logs to cloudwatch with context. Cloudwatch metric will have a filter pattern by looking
at the attrbiutes of that JSON payload. Trigger an alarm on specific type of error. Alarm will trigger an SNS topic.
SNS will have lambda subscription that will create a meaningful message and email to admin.

<img src="readmeimages/error-reporting.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/reported-log-email.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of Disaster Recovery(DR) Strategy

To avoid downtime and improve performance for a notes service, I have used multi-site active or active architecture with a global DynamoDB table, Route 53 latency routing policies, and an SSL/TLS certificate for the domain using cloudformation.

<img src="readmeimages/routing.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of api calls to External API

Utilized EventBridge's content-based filtering feature to facilitate seamless integration between our API and external APIs through an event-driven architecture and asynchronous communication. Additionally, configured a Dead Letter Queue (DLQ) to prevent the loss of events as event bridge loses events after 24 hrs.

<img src="readmeimages/external.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of CI/CD

Utilized AWS CodePipeline to automate my deployment process, combining continuous integration and continuous deployment. The pipeline is initiated by GitHub webhooks whenever new commits are pushed to the connected GitHub repository. The pipeline then packages the new code and moves it to an approval stage after running continuous integration tests. An approver then reviews the changes within the approval stage and approves the deployment. After approval, the pipeline deploys the new code, thereby achieving continuous deployment.

<img src="readmeimages/cicd.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/cicd-dev.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉Architecture of Books Service

Create an AWS AppSync GraphQL API with subscriptions and use AWS Lambda functions as resolvers, using the Serverless Framework to deploy and manage the resources. Specifically, I enabled real-time data updates through subscriptions and leverage the scalability and cost-effectiveness of AWS Lambda to handle the API's business logic.

<img src="readmeimages/appsync.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉 Architecture of Ecommerce API

An ecommerce API with 3 microservices for Product, Basket, and Order can be implemented using three different patterns: synchronous, asynchronous, and event sourcing.

The synchronous approach involves REST APIs where each microservice waits for a response before proceeding. The asynchronous approach uses message brokers to decouple the microservices and improve scalability.

Event sourcing to record all the events and transactions that occur in the system, polling from sqs to retrieve records and invoke functions.

<img src="readmeimages/ecommerce.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉 Architecture of Checkout Order

Utilized the CDK and Step Functions with saga pattern to seamlessly orchestrate the flow of checkout order using express workflow.

<img src="readmeimages/orchestrate-checkout.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/checkout-workflow-1.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/checkout-workflow-2.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉 Architecture of Check product quantity

Utilized the CDK and Step Functions with to loop through all products in database and remove products that are out of stock using step functions callback pattern and mapping products.

<img src="readmeimages/mapping-orchestrate.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/mapping-orchestrate-1.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉 Architecture of Increasing apis performance

I followed the best practices for Lambda and API Gateway integration to ensure optimal performance, scalability, and security in my application.

<img src="readmeimages/best-practices.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉 Architecture of Authentication Cognito CDK

To implement authentication in a CDK services, I utilized Amazon Cognito. This allowed me to easily incorporate user sign-up, sign-in, and access control functionality into my app services.

<img src="readmeimages/cognito-cdk.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/Cognito.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉 Architecture of Product Search with ElasticCache Redis

The Lambda function was configured to run inside a VPC and assigned a security group allowing outbound traffic to the Redis cluster.
The Redis cluster's security group was configured to allow inbound traffic from the Lambda function's security group
When lambda is run in VPC, it won't have access to internet (so access to public APIs won't work). NATGateway is required for this. But to improve security I have created Gateway endpoint and interface endpoints that can access services like DynamoDB and Kinesis streams without NAT establishing secure and private connection.

You can also use NAT Gateway to access internet but Gateway endpoints are cheaper, secure and scalable.

Gateway endpoints are used to connect to AWS services that are accessed over the internet, such as Amazon S3 or DynamoDB
Interface endpoints, on the other hand, are used to connect to AWS services that are accessed over a private network connection, such as Amazon EC2 or Elastic Load Balancing

<img src="readmeimages/elasticcache-architrecture.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/ElastiCache.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉 Architecture of Serverful express app

To improve the performance of a Node.js Express app, used Worker Threads for high computing tasks and Clustering for instances of the app with PM2. In Node.js, worker threads can help you perform high-computing tasks by moving work onto separate threads that don't block the event loop. The cluster module, on the other hand, helps you run multiple instances of your application in parallel.

<img src="readmeimages/express.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/redis.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉 Architecture of Serverless express app

Used @vendia/serverless-express a package that allows you to deploy an Express.js app as a serverless application on AWS Lambda and API Gateway. It provides an easy way to wrap your existing Express.js app in a Lambda function and map API Gateway events to Express.js requests.

<img src="readmeimages/express-app-serverless.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉 Architecture of Serverless apollo graphql server

Used startServerAndCreateLambdaHandler it simplifies the process of integrating Apollo Server with AWS Lambda. With this package, you can easily create a Lambda handler function that can start an Apollo Server instance and handle incoming requests.

<img src="readmeimages/apollo.png" style="max-width: 100%; height: auto; object-fit: contain;">

## 👉 Architecture of Serverless chat app

Developed an AWS AppSync API that utilizes GraphQL queries, mutations, and subscriptions, and leverages VTL (Velocity Template Language) to interface with a DynamoDB datasource for handling queries. Additionally, implemented AWS Lambda functions to support mutations and subscriptions.

<img src="readmeimages/chat.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/appsync-aws.png" style="max-width: 100%; height: auto; object-fit: contain;">

Single table design, we would use one single table for all our app. By having all entities in a single table, we can construct queries that return all the needed data with a single interaction with DynamoDB, speeding up the performance of the application for specific access patterns.

#### Access patterns:

✅ Create/Update/Delete User Accounts.
✅ Create/Update/Delete groups.
✅ Add a users to a group.
✅ Send Message in group.
✅ Typing Indicator when a group member is typing.
✅ Get all messages per group.
✅ Get Groups a user belongs to.
✅ Get all groups created by user.

<img src="readmeimages/table-design.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/single-table-design.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/no_sql_workbench.png" style="max-width: 100%; height: auto; object-fit: contain;">

## Nanny Booking API

✅ Authenticating and authorizing(Groups) a GraphQL API using AWS Cognito.
✅ Effectively using AWS Lambda Powertools to properly instrument your application.
✅ Orchestrating part of an application with Step Functions.
✅ Decoupling an Application with Queues.

ENTITIES:
📌 User
📌 Job
📌 Application
📌 Ratings

#### User:

• Admin
• Parent(Single or Couple)
• Nanny

User Profiles:

Nanny attributes:
• Full Names
• Date of Birth
• Gender
• Spoken languages
• Current Location
• Nationality
• Region of Origin
• National ID Card or Some Kind of identification
• Phone Number(Just of verification)
• Profile Picture
• Hourly Rate
• Level of Education
• Smoke/drink etc
• Any Disability
• Brief Description
• List of activities they can do

Parent attributes:
• Full Names
• Location
• Date of Birth
• Phone Number(Just for Verification)
• List of Job postings

#### Job:

Parents can put up a job posting like(We need somebody, aged between 21 and 40 to look after our son everyday from 8AM to 6PM.
Job Type
Schedule(Time and Date)
Location
Number of Kids
Cost etc.

#### Applications:

Nannies should be able to apply to a job posted by a Parent.
Rate/Feedback:
Rate/Leave feedback on a nanny after job completion by a parent.
Rate/Leave Feedback on a parent after a job completion by a nanny.

#### Ratings and Reviews

Nanny's
• Answer a set of questions based on their experience with a Parent.
• Leave a brief review
• Leave a rating
Parents
• Answer a set of questions based on their experience with a Nanny.
• Leave a brief review
• Leave a rating
• Reviews/Ratings will be publicly visible on each users profile.

#### Access patterns:

🔹 Create/Read/Update/Delete User account(Parent,Nanny)
🔹 Update User Account Status(VERIFIED,UNVERIFIED,DEACTIVATED) by admin only
🔹 Create Job(By Parent Only)
🔹 Apply to Job(By Nanny Only)
🔹 Book Nanny(By Parent Only)
🔹 View all Open/Closed Jobs(By Nanny or Admins Only)
🔹 View all jobs applied to (By Nanny or admins only)
🔹 View all applications for a job(By Parent or Admin only)
🔹 View All jobs per parent(Only Parents or admin). A Parent can only view their jobs
🔹 View All Nannies/Parents

#### Database Design:

1. Create/Read/Update/Delete User (Transaction Process)
   PK=USER#<Username>
   SK=USER#<Username>
   PK=USEREMAIL#<Email>
   SK=USEREMAIL#<Email>
2. Create/Update/Read/Delete Jobs
   PK=USER#<Username>
   SK=JOB#<JobId>
3. Create/Update Application
   PK=JOB#<JobId>#APPLICATION#<ApplicationId>
   PK=JOB#<JobId>#APPLICATION#<ApplicationId>
4. List all jobs per User
   PK=USER#<Username>
   SK= BEGINS_WITH('JOB#')
5. Book a Nanny (StepFunctions Workflow)
   PK=USER#<Username>
   SK=JOB#<JobId>
   PK=JOB#<JobId>#APPLICATION#<ApplicationId>
   PK=JOB#<JobId>#APPLICATION#<ApplicationId>

Global Secondary Indexes:

1. jobApplications: Get applications for a job. Parents have to see all applications for the job they posted, in-order to book who they intend to work with.
   PK = GSI1PK AND SK=GSI1SK
2. jobsAppliedTo: A Nanny would definitely love to see all the jobs they applied to
   PK = GSI2PK AND SK=GSI2SK
3. getJobsByStatus: It's essential to display OPEN jobs to jobseekers. The system admin would also love to see open /closed jobs for app performance.
   PK = jobStatus AND SK=GSI1SK

<img src="readmeimages/database_design.png" style="max-width: 100%; height: auto; object-fit: contain;">
<img src="readmeimages/nanny-job.png" style="max-width: 100%; height: auto; object-fit: contain;">
