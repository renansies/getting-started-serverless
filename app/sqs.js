exports.handler = async function(event, context) {
    const sqsEventData = event.Records[0];
    const logJSON = {
        queueArn: sqsEventData.eventSourceARN,
        messageId:sqsEventData.messageId,
        body: sqsEventData.body 
    };
    console.log(JSON.stringify(logJSON));
}