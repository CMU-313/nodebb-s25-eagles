/*

const assert = require('assert');
const mocha = require('mocha');
const db = require('../mocks/databasemock');
const user = require('../../src/user');
const groups = require('../../src/groups');
const password = require('../../src/password');
const socketUser = require('../../src/socket.io/user');


const { describe, it, before } = mocha;

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
			db.getObjectField(`user:${uid}`, 'password'),
		]);

		const match = await password.compare('newpassword', storedPassword, true);
		assert(match);
		assert.strictEqual(userData['email:confirmed'], 1);
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
*/
