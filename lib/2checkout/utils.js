var request = require('request');
var rp = require('request-promise');

exports.execute = function (args, callback) {
	options = {
		uri: args.domain + args.path,
		method: args.method,
		headers: {"Accept": "application/json"},
		timeout: 30000
	};

	if (args.type === "admin") {
		options.auth = {
			user: args.apiUser,
			pass: args.apiPass,
			sendImmediately: true
		};

		if (args.method === "POST") {
			options.form = args.payload;
		} else {
			options.qs = args.payload;
		}
	} else {
		args.payload.privateKey = args.privateKey;
		args.payload.sellerId = args.sellerId;
		options.body = JSON.stringify(args.payload);
	}

	if (!callback) {
		return rp(options)
			.then(body => {
				return Promise(() => {
					return JSON.parse(body);
				})
					.then(parsedResponse => {
						if (args.type === "admin") {
							if (parsedResponse.errors) {
								return Promise.reject(new Error(parsedResponse.errors[0].message));
							}
						} else {
							if (parsedResponse.exception) {
								return Promise.reject(new Error(parsedResponse.exception.errorMsg));
							}

							return parsedResponse;
						}
					})
					.catch(() => {
						return Promise.reject(new Error('Error parsing JSON response from 2Checkout API.'));
					});
			})
			.catch(error => {
				return Promise.reject(new Error('Unable to connect to 2Checkout API'));
			});
	}

	request(options, function (error, response, body) {
		var parsedResponse;
		if (error) {
			callback(new Error('Unable to connect to 2Checkout API'));
		} else {

			try {
				parsedResponse = JSON.parse(body);
			} catch (e) {
				callback(new Error('Error parsing JSON response from 2Checkout API.'));
				return;
			}

			if (args.type === "admin") {
				if (parsedResponse.errors) {
					callback(new Error(parsedResponse.errors[0].message));
					return;
				}
			} else {
				if (parsedResponse.exception) {
					callback(new Error(parsedResponse.exception.errorMsg));
					return;
				}
			}

			callback(null, parsedResponse);

		}

	});
};