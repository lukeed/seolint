import { request } from 'https';
import { globalAgent } from 'http';

// @see (modified) lukeed/httpie
export function fetch(url: string): Promise<string> {
	return new Promise((res, rej) => {
		let html = '';
		let agent = /^http:\/\//.test(url) && globalAgent;
		let req = request(url, { agent }, r => {
			let type = r.headers['content-type'] || '';

			if (!type.includes('text/html')) {
				return rej('Invalid "Content-Type" header');
			}

			r.setEncoding('utf8');
			r.on('data', d => { html += d });
			r.on('end', () => res(html));
		});

		req.on('error', rej);
		req.end(); // send
	});
}
