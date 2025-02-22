

/* eslint-disable jest/expect-expect */
const assert = require('assert');
const async = require('async');

// const db = require('../mocks/databasemock');

const user = require('../../src/user');
const groups = require('../../src/groups');
const password = require('../../src/password');
const utils = require('../../src/utils');

const socketUser = require('../../src/socket.io/user');

describe('Password reset (library methods)', () => {
	let uid;
	let code;

	before(async () => {
		uid = await user.create({ username: 'resetuser', password: '123456' });
		await user.setUserField(uid, 'email', 'reset@me.com');
		await user.email.confirmByUid(uid);
	});

	it('.generate() should generate a new reset code', async () => {
		code = await user.reset.generate(uid);
		assert(code);
		assert.strictEqual(typeof code, 'string');
	});

	it('.generate() should invalidate a previously generated reset code', async () => {
		const _code = await user.reset.generate(uid);
		const valid = await user.reset.validate(code);
		assert.strictEqual(valid, false);

		code = _code;
	});

	it('.validate() should ensure that this new code is valid', async () => {
		const valid = await user.reset.validate(code);
		assert.strictEqual(valid, true);
	});

	it('.validate() should correctly identify an invalid code', async () => {
		const valid = await user.reset.validate(`${code}abcdef`);
		assert.strictEqual(valid, false);
	});

	it('.send() should create a new reset code and reset password', async () => {
		code = await user.reset.send('reset@me.com');
		assert(code);
	});

	it('.commit() should update the user\'s password and confirm their email', async () => {
		await user.reset.commit(code, 'newpassword');

		const [userData, storedPassword] = await Promise.all([
			user.getUserData(uid),
			// db.getObjectField(`user:${uid}`, 'password'),
		]);

		const match = await password.compare('newpassword', storedPassword, true);
		assert(match);
		assert.strictEqual(userData['email:confirmed'], 1);
		assert(userData);
		assert(storedPassword);
	});

	it('.should error if same password is used for reset', async () => {
		const uid = await user.create({ username: 'badmemory', email: 'bad@memory.com', password: '123456' });
		const code = await user.reset.generate(uid);
		await assert.rejects(user.reset.commit(code, '123456'), {
			message: '[[error:reset-same-password]]',
		});
	});

	it('should not validate email if password reset is due to expiry', async () => {
		const uid = await user.create({ username: 'resetexpiry', email: 'reset@expiry.com', password: '123456' });
		await user.setUserField(uid, 'passwordExpiry', Date.now());

		const code = await user.reset.generate(uid);
		await user.reset.commit(code, '654321');

		const [confirmed, verified, unverified] = await Promise.all([
			user.getUserField(uid, 'email:confirmed'),
			groups.isMemberOfGroups(uid, ['verified-users']),
			groups.isMemberOfGroups(uid, ['unverified-users']),
		]);

		assert.strictEqual(confirmed, 0);
		assert.strictEqual(verified, false);
		assert.strictEqual(unverified, true);
	});
});

describe('locks', () => {
	let uid;
	let email;

	beforeEach(async () => {
		const username = utils.generateUUID().slice(0, 10);
		const password = utils.generateUUID();
		uid = await user.create({ username, password });
		email = `${username}@nodebb.org`;
		await user.setUserField(uid, 'email', email);
		await user.email.confirmByUid(uid);
	});

	it('should disallow reset request if one was made within the minute', async () => {
		await user.reset.send(email);
		await assert.rejects(user.reset.send(email), {
			message: '[[error:reset-rate-limited]]',
		});
	});

	it('should not allow multiple calls to the reset method at the same time', async () => {
		await assert.rejects(Promise.all([
			user.reset.send(email),
			user.reset.send(email),
		]), {
			message: '[[error:reset-rate-limited]]',
		});
	});

	it('should not allow multiple socket calls to the reset method either', async () => {
		await assert.rejects(Promise.all([
			socketUser.reset.send({ uid: 0 }, email),
			socketUser.reset.send({ uid: 0 }, email),
		]), {
			message: '[[error:reset-rate-limited]]',
		});
	});

	it('should properly unlock user reset after a cooldown period', async () => {
		await user.reset.send(email);
		await assert.rejects(user.reset.send(email), {
			message: '[[error:reset-rate-limited]]',
		});

		user.reset.minSecondsBetweenEmails = 3;
		await new Promise((resolve) => { setTimeout(resolve, 4000); }); // Wait 4 seconds

		await user.reset.send(email);
		user.reset.minSecondsBetweenEmails = 60;
	});
});
