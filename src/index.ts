/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import checkFirecrwalUsage from './firecrawl';
const SafeToken = 'h7348yfryf8f3frghand9';

export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(event, env, ctx): Promise<void> {
		// A Cron Trigger can make requests to other endpoints on the Internet,
		// publish to a Queue, query a D1 Database, and much more.
		//
		// We'll keep it simple and make an API call to a Cloudflare API:
		// let resp = await fetch('https://api.cloudflare.com/client/v4/ips');
		// let wasSuccessful = resp.ok ? 'success' : 'fail';

		// // You could store this result in KV, write to a D1 Database, or publish to a Queue.
		// // In this template, we'll just log the result:
		// console.log(`trigger fired at ${event.cron}: ${wasSuccessful}`);
		await checkFirecrwalUsage(env);
	},
	async fetch(request, env, ctx) {
		if (!request.url.includes(SafeToken)) {
			return new Response('failed', {
				status: 403,
			});
		}
		return checkFirecrwalUsage(env).then((res) => {
			return new Response(JSON.stringify({ ok: true, data: res }), {
				headers: {
					'content-type': 'application/json',
				},
			});
		});
	},
} satisfies ExportedHandler<Env>;
