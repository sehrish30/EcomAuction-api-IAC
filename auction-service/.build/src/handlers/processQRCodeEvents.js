"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
// this is our serverless worker that will
// consume messages from our sqs correctly
var processQRCodeEvents = function (event) {
    // get records of sqs batch in the event object
    var records = event.Records;
    var batchItemFailures = [];
    if (records.length) {
        for (var _i = 0, records_1 = records; _i < records_1.length; _i++) {
            var record = records_1[_i];
            try {
                var parsedBody = JSON.parse(record.body);
                console.log({ parsedBody: parsedBody.detail });
                if (typeof parsedBody.detail.auctionDetail !== "string") {
                    throw new Error("processQRCodeEvents must be a string");
                }
            }
            catch (err) {
                // get the message id and add it to send it back to sqs
                batchItemFailures.push({
                    // itemIdentifier is message id
                    itemIdentifier: record.messageId
                });
            }
        }
    }
    // message will be sent to sqs queue
    return {
        batchItemFailures: batchItemFailures
    };
};
exports.handler = processQRCodeEvents;
/**
 * serverless logs -f processQRCodeEvents
 * serverless deploy function --function processQRCodeEvents
 */
//# sourceMappingURL=processQRCodeEvents.js.map