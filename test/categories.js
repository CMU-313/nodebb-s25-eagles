'use strict';

const assert = require('assert');
const nconf = require('nconf');

const request = require('../src/request');
const db = require('./mocks/databasemock');
const Categories = require('../src/categories');
const Topics = require('../src/topics');
const User = require('../src/user');
const groups = require('../src/groups');
const privileges = require('../src/privileges');

describe('Categories', () => {
	let categoryObj;
	let posterUid;
	let adminUid;

	before(async () => {
		try {
			posterUid = await User.create({ username: 'poster' });
			adminUid = await User.create({ username: 'admin' });
			await groups.join('administrators', adminUid);

			categoryObj = await new Promise((resolve, reject) => {
				Categories.create(
					{
						name: 'Test Category & NodeBB',
						description: 'Test category created by testing script',
						icon: 'fa-check',
						blockclass: 'category-blue',
						order: '5',
					},
					(err, category) => {
						if (err) return reject(err);
						resolve(category);
					}
				);
			});

			if (!categoryObj || !categoryObj.cid) {
				throw new Error('Category creation failed, categoryObj is not defined or missing cid');
			}
		} catch (err) {
			console.error('Setup failed:', err);
			throw err;
		}
	});

	it('should get category by id', async () => {
		assert.ok(categoryObj, 'categoryObj is not defined');
		assert.ok(categoryObj.cid, 'categoryObj.cid is missing');

		const categoryData = await new Promise((resolve, reject) => {
			Categories.getCategoryById(
				{
					cid: categoryObj.cid,
					start: 0,
					stop: -1,
					uid: 0,
				},
				(err, data) => (err ? reject(err) : resolve(data))
			);
		});

		assert(categoryData, 'categoryData is null');
		assert.equal(categoryData.name, 'Test Category &amp; NodeBB');
		assert.equal(categoryData.description, categoryObj.description);
		assert.strictEqual(categoryObj.disabled, 0);
	});

	it('should return null for non-existent category', async () => {
		const categoryData = await new Promise((resolve, reject) => {
			Categories.getCategoryById(
				{
					cid: 123123123,
					start: 0,
					stop: -1,
				},
				(err, data) => (err ? reject(err) : resolve(data))
			);
		});

		assert.strictEqual(categoryData, null);
	});

	it('should get all categories', async () => {
		const data = await new Promise((resolve, reject) => {
			Categories.getAllCategories((err, categories) => (err ? reject(err) : resolve(categories)));
		});

		assert(Array.isArray(data), 'getAllCategories did not return an array');
		assert(data.some(category => category.cid === categoryObj.cid), 'Category not found in all categories');
	});

	it('should load a category route', async () => {
		assert.ok(categoryObj, 'categoryObj is not defined');
		assert.ok(categoryObj.cid, 'categoryObj.cid is missing');

		const { response, body } = await request.get(
			`${nconf.get('url')}/api/category/${categoryObj.cid}/test-category`
		);

		assert.strictEqual(response.statusCode, 200, 'Response status is not 200');
		assert.strictEqual(body.name, 'Test Category &amp; NodeBB', 'Category name mismatch');
		assert(body, 'Body response is empty');
	});

	// Ensure all other test cases check for categoryObj before proceeding
	describe('Categories.getRecentTopicReplies', () => {
		it('should not throw', async () => {
			assert.ok(categoryObj, 'categoryObj is not defined');
			assert.ok(categoryObj.cid, 'categoryObj.cid is missing');

			const categoryData = await new Promise((resolve, reject) => {
				Categories.getCategoryById(
					{
						cid: categoryObj.cid,
						set: `cid:${categoryObj.cid}:tids`,
						reverse: true,
						start: 0,
						stop: -1,
						uid: 0,
					},
					(err, data) => (err ? reject(err) : resolve(data))
				);
			});

			await new Promise((resolve, reject) => {
				Categories.getRecentTopicReplies(categoryData, 0, {}, err => (err ? reject(err) : resolve()));
			});
		});
	});

	// Repeat similar fixes for all other test cases that use categoryObj
});
