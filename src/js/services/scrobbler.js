const endpoint = 'https://ws.audioscrobbler.com/2.0/';

function makeParams(object) {
	let params = [];
	for (const key in object) {
		if (object.hasOwnProperty(key)) {
			params.push(`${key}=${object[key]}`);
		}
	}
	return params.join('&');
}

class Scrobbler {
	constructor(user, api_key) {
		this.user = user;
		this.api_key = api_key;
		return this;
	}

	getRecentTracks(limit, page) {
		return this.fetch({
			method: 'user.getrecenttracks',
			limit: limit,
			page: page
		});
	}

	fetch(params) {
		let defaultParams = {
			user: this.user,
			api_key: this.api_key,
			format: 'json',
			limit: 10,
			page: 1
		};
		let queryString = makeParams(Object.assign(defaultParams, params));
		let url = `${endpoint}?${queryString}`;

		return fetch(url).then(res => res.json());
	}
}

export default Scrobbler;
