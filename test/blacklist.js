

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

	it('should validate rules', () => new Promise((resolve, reject) => {
		socketBlacklist.validate({ uid: adminUid }, { rules: rules }, (err, data) => {
			if (err) {
				return reject(err);
			}
			resolve(data);
		});
	}));

	it('should not save rules without privileges', () => new Promise((done) => {
		socketBlacklist.save({ uid: 0 }, rules, (err) => {
			assert.equal(err.message, '[[error:no-privileges]]');
			done();
		});
	}));

	it('should save rules with admin privileges', () => new Promise((done) => {
		socketBlacklist.save({ uid: adminUid }, rules, (err) => {
			assert.ifError(err);
			done();
		});
	}));

	it('should not blacklist an IP not in the rules', () => new Promise((done) => {
		blacklist.test('3.3.3.3', (err) => {
			assert.ifError(err);
			done();
		});
	}));

	it('should blacklist an IP in the rules', () => new Promise((done) => {
		blacklist.test('1.1.1.1', (err) => {
			assert.equal(err.message, '[[error:blacklisted-ip]]');
			done();
		});
	}));

	it('should blacklist an IP with port in the rules', () => new Promise((done) => {
		blacklist.test('1.1.1.1:4567', (err) => {
			assert.equal(err.message, '[[error:blacklisted-ip]]');
			done();
		});
	}));

	it('should not blacklist an IPv6 address not in the rules', () => new Promise((done) => {
		blacklist.test('2001:db8:85a3:0:0:8a2e:370:7334', (err) => {
			assert.ifError(err);
			done();
		});
	}));

	it('should blacklist an IP in the CIDR range', () => new Promise((done) => {
		blacklist.test('192.168.100.1', (err) => {
			assert.equal(err.message, '[[error:blacklisted-ip]]');
			done();
		});
	}));
});
