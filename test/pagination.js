'use strict';


const assert = require('assert');
const pagination = require('../src/pagination');

describe('Pagination', () => {
	new Promise((resolve, reject) => {
		try {
			const data = pagination.create(1, 1);
			assert.strictEqual(data.pages.length, 0);
			assert.strictEqual(data.rel.length, 0);
			assert.strictEqual(data.pageCount, 1);
			assert.strictEqual(data.prev.page, 1);
			assert.strictEqual(data.next.page, 1);
			resolve();
		} catch (error) {
			reject(error);
		}
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		try {
			const data = pagination.create(2, 10);
			// [1, (2), 3, 4, 5, separator, 9, 10]
			assert.strictEqual(data.pages.length, 8);
			assert.strictEqual(data.rel.length, 2);
			assert.strictEqual(data.pageCount, 10);
			assert.strictEqual(data.prev.page, 1);
			assert.strictEqual(data.next.page, 3);
			resolve();
		} catch (error) {
			reject(error);
		}
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		try {
			const data = pagination.create(1, 3, { key: 'value' });
			assert.strictEqual(data.pages.length, 3);
			assert.strictEqual(data.rel.length, 1);
			assert.strictEqual(data.pageCount, 3);
			assert.strictEqual(data.prev.page, 1);
			assert.strictEqual(data.next.page, 2);
			assert.strictEqual(data.pages[0].qs, 'key=value&page=1');
			resolve();
		} catch (error) {
			reject(error);
		}
	}).catch(err => assert.ifError(err));
});
