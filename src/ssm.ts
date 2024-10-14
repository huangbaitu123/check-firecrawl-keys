import { SSMClient, GetParametersCommand } from '@aws-sdk/client-ssm';

export async function getValueFromSSM(key: string, env: Env) {
	const params = {
		Names: [key],
		WithDecryption: true,
	};
	const client = new SSMClient({
		region: 'us-west-1',
		credentialDefaultProvider: (input) => {
			return () => {
				return Promise.resolve({
					accessKeyId: env.AWS_ACCESS_KEY_ID,
					secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
				});
			};
		},
	});
	const command = new GetParametersCommand(params);
	const response = await client.send(command);

	if (response.InvalidParameters?.length) {
		throw new Error('Parameters InvalidParameters: ' + response.InvalidParameters.join(', '));
	}
	return response.Parameters?.[0].Value;
}
