

const assert = require('assert');
const path = require('path');

const db = require('./mocks/databasemock');
const image = require('../src/image');
const file = require('../src/file');

describe('image', () => {
	new Promise((resolve, reject) => {
		image.normalise(path.join(__dirname, 'files/normalise.jpg'), '.jpg', (err) => {
			if (err) return reject(err);

			file.exists(path.join(__dirname, 'files/normalise.jpg.png'), (err, exists) => {
				if (err) return reject(err);
				try {
					assert(exists);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		image.resizeImage({
			path: path.join(__dirname, 'files/normalise.jpg'),
			target: path.join(__dirname, 'files/normalise-resized.jpg'),
			width: 50,
			height: 40,
		}, (err) => {
			if (err) return reject(err);

			image.size(path.join(__dirname, 'files/normalise-resized.jpg'), (err, bitmap) => {
				if (err) return reject(err);
				try {
					assert.equal(bitmap.width, 50);
					assert.equal(bitmap.height, 40);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		});
	}).catch(err => assert.ifError(err));
});
