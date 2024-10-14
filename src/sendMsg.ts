export default function sendMessage(content: string, env: Env) {
	return fetch('https://wxpusher.zjiecode.com/api/send/message', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			appToken: env.WX_PUSHER_APP_TOKEN,
			content,
			summary: 'Firecrawl Keys usage',
			contentType: 2,
			uids: [env.WX_PUSHER_USER_ID],
		}),
	});
}
