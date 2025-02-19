'use strict';

const async = require('async');
const assert = require('assert');

const db = require('./mocks/databasemock');
const groups = require('../src/groups');
const user = require('../src/user');
const blacklist = require('../src/meta/blacklist');

describe('blacklist', () => {
	let adminUid;

	before((done) => {
		user.create({ username: 'admin' }, (err, uid) => {
			assert.ifError(err);
			adminUid = uid;
			groups.join('administrators', adminUid, done);
		});
	});

	const socketBlacklist = require('../src/socket.io/blacklist');
	const rules = '1.1.1.1\n2.2.2.2\n::ffff:0:2.2.2.2\n127.0.0.1\n192.168.100.0/22';

	new Promise((resolve, reject) => {
		socketBlacklist.validate({ uid: adminUid }, { rules: rules }, (err, data) => {
			if (err) return reject(err);
			resolve();
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		socketBlacklist.save({ uid: 0 }, rules, (err) => {
			try {
				assert.equal(err.message, '[[error:no-privileges]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		socketBlacklist.save({ uid: adminUid }, rules, (err) => {
			if (err) return reject(err);
			resolve();
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		blacklist.test('3.3.3.3', (err) => {
			if (err) return reject(err);
			resolve();
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		blacklist.test('1.1.1.1', (err) => {
			try {
				assert.equal(err.message, '[[error:blacklisted-ip]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		blacklist.test('1.1.1.1:4567', (err) => {
			try {
				assert.equal(err.message, '[[error:blacklisted-ip]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		blacklist.test('2001:db8:85a3:0:0:8a2e:370:7334', (err) => {
			if (err) return reject(err);
			resolve();
		});
	}).catch(err => assert.ifError(err));

	new Promise((resolve, reject) => {
		blacklist.test('192.168.100.1', (err) => {
			try {
				assert.equal(err.message, '[[error:blacklisted-ip]]');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}).catch(err => assert.ifError(err));
});
