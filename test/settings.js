

const assert = require('assert');
const nconf = require('nconf');

const db = require('./mocks/databasemock');
const settings = require('../src/settings');

describe('settings v3', () => {
	let settings1;
	let settings2;

	new Promise((resolve, reject) => {
		settings1 = new settings('my-plugin', '1.0', { foo: 1, bar: { derp: 2 } }, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});

	new Promise((resolve, reject) => {
		try {
			assert.equal(settings1.get('foo'), 1);
			assert.equal(settings1.get('bar.derp'), 2);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		settings2 = new settings('my-plugin', '1.0', { foo: 1, bar: { derp: 2 } }, (err) => {
			if (err) {
				return reject(err);
			}
			resolve();
		});
	});

	new Promise((resolve, reject) => {
		settings1.set('foo', 3);
		settings1.persist((err) => {
			if (err) {
				return reject(err);
			}
			// give pubsub time to complete
			setTimeout(() => {
				try {
					assert.equal(settings2.get('foo'), 3);
					resolve();
				} catch (error) {
					reject(error);
				}
			}, 500);
		});
	});

	new Promise((resolve, reject) => {
		try {
			settings1.set('bar.derp', 5);
			assert.equal(settings1.get('bar.derp'), 5);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		settings1.reset((err) => {
			if (err) {
				return reject(err);
			}
			try {
				assert.equal(settings1.get('foo'), 1);
				assert.equal(settings1.get('bar.derp'), 2);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	});

	new Promise((resolve, reject) => {
		try {
			const newSettings = new settings('some-plugin', '1.0', { default: { value: 1 } });
			assert.equal(newSettings.get('default.value'), 1);
			resolve();
		} catch (error) {
			reject(error);
		}
	});
});
