import { APIGatewayProxyEventV2 } from "aws-lambda";
import { DynamoDB } from 'aws-sdk';
import { DDB_TABLE_CHAT } from './constants';

interface ChatRecord {
    readonly room: string;
    readonly name: string;
    readonly comment: string;
    readonly time: string;
};

const dynamoDb = new DynamoDB.DocumentClient({
    region: 'us-east-1'
});

export const handler = async (event: APIGatewayProxyEventV2) => {
    const method = event.requestContext.http.method;

    if (method === 'GET') {
        const name = event.queryStringParameters?.name || '';
        const result = await getComment(name);

        return {
            statusCode: 200,
            body: JSON.stringify({
                result
            })
        };
    }

    if (method === 'POST') {
        const result = await postComment(event.body || '');
        const statusCode = !!result ? 200 : 400;

        return  {
            statusCode,
            body: JSON.stringify({
                result
            })
        };
    }

    return {
        statusCode: 400,
        body: JSON.stringify({ event })
    };
};

const getComment = async (name: string): Promise<ChatRecord[]> => {
    const getParams = {
        TableName: DDB_TABLE_CHAT,
        KeyConditionExpression: '#user = :user',
        ExpressionAttributeValues: {
            ':user': name
        },
        ExpressionAttributeNames: { '#user': 'name'}
    };

    try {
        const result = await dynamoDb.query(getParams).promise();
        return result.Items as ChatRecord[];
    } catch (err) {
        console.log(`err to get chat record for ${name}`, err);
        return [];
    }
};

const postComment = async (
    eventBody: string
) : Promise<ChatRecord | undefined> => {
    const chat: ChatRecord = JSON.parse(eventBody);
    const param = {
        TableName: DDB_TABLE_CHAT,
        Item: {
            name: chat.name,
            time: new Date().toISOString(),
            comment: chat.comment,
            chat_room: chat.room
        }
    };

    try {
        const result = await dynamoDb.put(param).promise();
        console.log('Save chat record: ', result);
        return chat;
    } catch (err) {
        console.log('err to save chat record', err);
        return undefined;
    }
}
