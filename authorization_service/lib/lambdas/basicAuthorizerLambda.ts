import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
  PolicyDocument,
  StatementEffect,
} from "aws-lambda";

type policyContext = {
  statusCode: number;
  message: string;
}

const generatePolicy = (
  principalId: string,
  effect: StatementEffect,
  resource: string,
  context?: policyContext
): APIGatewayAuthorizerResult => {
  const policyDocument: PolicyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: resource,
      },
    ],
  };

  return {
    principalId,
    policyDocument,
    context
  };
};

class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number){
    super(message);
    this.statusCode = statusCode
  }
}

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log("Incoming event:", event);

  try {
    const authTokenHeader = event.authorizationToken;
  
    if (!authTokenHeader) {
      throw new AuthError("Unauthorized: No Authorization header provided", 401);
    }
  
    if (!authTokenHeader.startsWith("Basic ")) {
      throw new AuthError("Forbidden: Invalid authorization scheme", 403);
    }
  
    const base64Credentials = authTokenHeader.split(" ")[1];
    const credintials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    const [username, password] = credintials.split(":");
  
    const expectedPwd = process.env.irakli1603;
    if (expectedPwd !== password) {
      throw new AuthError("Forbidden: Invalid credentials", 403);
    }
  
    return generatePolicy(username, "Allow", event.methodArn);
  } catch(error) {
    if(error instanceof AuthError){
      const { statusCode, message } = error;
      return generatePolicy("unidentifiedUser", "Deny", event.methodArn, { statusCode, message })
    }

    return generatePolicy("unidentifiedUser", "Deny", event.methodArn, { statusCode: 500, message: 'Internal Authorizer Error' })
  }
};
