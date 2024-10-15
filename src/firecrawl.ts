import { getValueFromSSM } from './ssm';
import sendMessage from './sendMsg';
import * as cheerio from 'cheerio';

const Accounts = [
	'wenici2401@paxnw.com',
	'rebaxec363@paxnw.com',
	'mojowej337@adambra.com',
	'pawej76608@paxnw.com',
	'yiwiboj655@chainds.com',
	'yovako7967@skrank.com',
	'hewiba2984@skrank.com',
];

function checkAccountUsage(email: string) {
	const password = Accounts.includes(email) ? email.split('@')[0].split('').reverse().join('') : email;
	return fetch('https://www.firecrawl.dev/signin/password_signin', {
		headers: {
			accept: 'text/x-component',
			'accept-language': 'zh-CN,zh;q=0.9',
			'cache-control': 'no-cache',
			'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryxg0OgjIYhIUBdJYs',
			'next-action': 'ffd091b86bc49733798c9f7b0e6e4e7a3e2dba37',
			'next-router-state-tree':
				'%5B%22%22%2C%7B%22children%22%3A%5B%22(home)%22%2C%7B%22children%22%3A%5B%22signin%22%2C%7B%22children%22%3A%5B%5B%22id%22%2C%22password_signin%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
			pragma: 'no-cache',
			priority: 'u=1, i',
			'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128"',
			'sec-ch-ua-mobile': '?0',
			'sec-ch-ua-platform': '"Windows"',
			'sec-fetch-dest': 'empty',
			'sec-fetch-mode': 'cors',
			'sec-fetch-site': 'same-origin',
		},
		body: `------WebKitFormBoundaryxg0OgjIYhIUBdJYs\r\nContent-Disposition: form-data; name="1_email"\r\n\r\n${email}\r\n------WebKitFormBoundaryxg0OgjIYhIUBdJYs\r\nContent-Disposition: form-data; name="1_password"\r\n\r\n${password}\r\n------WebKitFormBoundaryxg0OgjIYhIUBdJYs\r\nContent-Disposition: form-data; name="0"\r\n\r\n["$K1","$undefined"]\r\n------WebKitFormBoundaryxg0OgjIYhIUBdJYs--\r\n`,
		method: 'POST',
	})
		.then((r) => {
			return r.headers.get('set-cookie') || '';
		})
		.then((cookie) => {
			const options = {
				headers: {
					accept:
						'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
					'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
					'cache-control': 'no-cache',
					pragma: 'no-cache',
					priority: 'u=0, i',
					'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128"',
					'sec-ch-ua-mobile': '?0',
					'sec-ch-ua-platform': '"Windows"',
					'sec-fetch-dest': 'document',
					'sec-fetch-mode': 'navigate',
					'sec-fetch-site': 'same-origin',
					'sec-fetch-user': '?1',
					'upgrade-insecure-requests': '1',
					cookie,
				},
				body: null,
				method: 'GET',
			};
			const usageUrl = 'https://www.firecrawl.dev/app/usage';
			return fetch(usageUrl, options).then((r) => {
				if (r.url !== usageUrl) {
					return Promise.reject(new Error(`Failed access ${r.status}`));
				}
				return r.text();
			});
		})
		.then((usageHtml) => {
			const $ = cheerio.load(usageHtml.replace('<!DOCTYPE html>', ''));
			const usage = $('#current-billing-cycle + div > div > div:nth-child(1) > dd > span:nth-child(1)').text();
			return {
				email,
				usage: usage.trim(),
			};
		})
		.catch((err) => {
			return Promise.reject(email + ':' + err?.message);
		});
}

// const Accounts = [
// 	'wenici2401@paxnw.com',
// 	'rebaxec363@paxnw.com',
// 	'mojowej337@adambra.com',
// 	'pawej76608@paxnw.com',
// 	'yiwiboj655@chainds.com',
// 	'yovako7967@skrank.com',
// ];

export default function checkFirecrwalUsage(env: Env) {
	let accountsResult = {};
	return getValueFromSSM('FIRECRAWL_ACCOUNT_LIST', env)
		.then((res) => {
			if (!res) {
				return;
			}
			const Accounts = res.split(',');
			return Promise.allSettled(
				Accounts.map((account) => {
					const [email] = account.split(':');
					return checkAccountUsage(email);
				})
			);
		})
		.then((result) => {
			if (!result) {
				return sendMessage('Failed to get SSM FIRECRAWL_EMAIL_LIST', env);
			}
			const outOfUsage: string[] = [];
			const failed: string[] = [];
			const success: string[] = [];
			for (const ret of result) {
				if (ret.status === 'fulfilled') {
					const msg = ret.value.email + ':' + ret.value.usage;
					if (parseInt(ret.value.usage ?? '') >= 98) {
						outOfUsage.push(msg);
					} else {
						success.push(msg);
					}
				} else {
					failed.push(ret.reason as string);
				}
			}
			accountsResult = { success, failed, outOfUsage };
			if (success.length < 3) {
				return sendMessage(
					`
				<h1>Firecrawl keys</h1>
				<h3>out of usage</h3>
				<ul>
				${outOfUsage.map((v) => `<li>${v}</li>`)}
				</ul>
				<h3>Failed</h3>
				<ul>
				${failed.map((v) => `<li>${v}</li>`)}
				</ul>
				<h3>Success</h3>
				<ul>
				${success.map((v) => `<li>${v}</li>`)}
				</ul>
				`,
					env
				);
			}
		})
		.then(() => {
			return accountsResult;
		});
}
