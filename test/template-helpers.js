'use strict';

const nconf = require('nconf');
const assert = require('assert');

const db = require('./mocks/databasemock');
const helpers = require('../src/helpers');

describe('helpers', () => {
	new Promise((resolve, reject) => {
		try {
			const flag = helpers.displayMenuItem({ navigation: [] }, 0);
			assert(!flag);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const flag = helpers.displayMenuItem({
				navigation: [{ route: '/users' }],
				user: { privileges: { 'view:users': false } },
			}, 0);
			assert(!flag);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const flag = helpers.displayMenuItem({
				navigation: [{ route: '/tags' }],
				user: { privileges: { 'view:tags': false } },
			}, 0);
			assert(!flag);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const flag = helpers.displayMenuItem({
				navigation: [{ route: '/groups' }],
				user: { privileges: { 'view:groups': false } },
			}, 0);
			assert(!flag);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const str = helpers.stringify({ a: 'herp < derp > and & quote "' });
			assert.equal(str, '{&quot;a&quot;:&quot;herp &lt; derp &gt; and &amp; quote \\&quot;&quot;}');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const str = helpers.escape('gdkfhgk < some > and &');
			assert.equal(str, 'gdkfhgk &lt; some &gt; and &amp;');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			assert.equal(helpers.generateCategoryBackground(null), '');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const category = {
				bgColor: '#ff0000',
				color: '#00ff00',
				backgroundImage: '/assets/uploads/image.png',
				imageClass: 'auto',
			};
			const bg = helpers.generateCategoryBackground(category);
			assert.equal(bg, 'background-color: #ff0000; border-color: #ff0000!important; color: #00ff00; background-image: url(/assets/uploads/image.png); background-size: auto;');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const category = { children: [] };
			assert.equal(helpers.generateChildrenCategories(category), '');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const category = {
				children: [
					{ link: '', bgColor: '#ff0000', color: '#00ff00', name: 'children' },
				],
			};
			const html = helpers.generateChildrenCategories(category);
			assert.equal(html, `<span class="category-children"><span class="category-children-item float-start"><div role="presentation" class="icon float-start" style="background-color: #ff0000; border-color: #ff0000!important; color: #00ff00;"><i class="fa fa-fw undefined"></i></div><a href="${nconf.get('relative_path')}/category/undefined"><small>children</small></a></span></span>`);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const className = helpers.generateTopicClass({ locked: true, pinned: true, deleted: true, unread: true });
			assert.equal(className, 'locked pinned deleted unread');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const btn = helpers.membershipBtn({ displayName: 'some group', name: 'some group', isMember: true });
			assert.equal(btn, '<button class="btn btn-danger " data-action="leave" data-group="some group" ><i class="fa fa-times"></i> [[groups:membership.leave-group]]</button>');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const btn = helpers.membershipBtn({ displayName: 'some group', name: 'some group', isPending: true });
			assert.equal(btn, '<button class="btn btn-warning disabled "><i class="fa fa-clock-o"></i> [[groups:membership.invitation-pending]]</button>');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const btn = helpers.membershipBtn({ displayName: 'some group', name: 'some group', isInvited: true });
			assert.equal(btn, '<button class="btn btn-warning" data-action="rejectInvite" data-group="some group">[[groups:membership.reject]]</button><button class="btn btn-success" data-action="acceptInvite" data-group="some group"><i class="fa fa-plus"></i> [[groups:membership.accept-invitation]]</button>');
			resolve();
		} catch (error) {
			reject(error);
		}
	});


	new Promise((resolve, reject) => {
		try {
			const btn = helpers.membershipBtn({ displayName: 'some group', name: 'some group', disableJoinRequests: false });
			assert.equal(btn, '<button class="btn btn-success " data-action="join" data-group="some group"><i class="fa fa-plus"></i> [[groups:membership.join-group]]</button>');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const btn = helpers.membershipBtn({ displayName: 'administrators', name: 'administrators' });
			assert.equal(btn, '');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const privs = {
				find: true,
				read: true,
			};
			const types = {
				find: 'viewing',
				read: 'viewing',
			};
			const html = helpers.spawnPrivilegeStates('guests', privs, types);
			assert.equal(html, `
					<td data-privilege="find" data-value="true" data-type="viewing">
						<div class="form-check text-center">
							<input class="form-check-input float-none" autocomplete="off" type="checkbox" checked />
						</div>
					</td>
				
					<td data-privilege="read" data-value="true" data-type="viewing">
						<div class="form-check text-center">
							<input class="form-check-input float-none" autocomplete="off" type="checkbox" checked />
						</div>
					</td>
				`);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const topicObj = { thumb: '/uploads/1.png', user: { username: 'baris' } };
			const html = helpers.renderTopicImage(topicObj);
			assert.equal(html, `<img src="${topicObj.thumb}" class="img-circle user-img" title="${topicObj.user.username}" />`);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const topicObj = { thumb: '', user: { uid: 1, username: 'baris', picture: '/uploads/2.png' } };
			const html = helpers.renderTopicImage(topicObj);
			assert.equal(html, `<img component="user/picture" data-uid="${topicObj.user.uid}" src="${topicObj.user.picture}" class="user-img" title="${topicObj.user.username}" />`);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const block = { teaser: { user: { username: 'baris', picture: '/uploads/1.png' } } };
			const html = helpers.renderDigestAvatar(block);
			assert.equal(html, `<img style="vertical-align: middle; width: 32px; height: 32px; border-radius: 50%;" src="${block.teaser.user.picture}" title="${block.teaser.user.username}" />`);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const block = { teaser: { user: { username: 'baris', 'icon:text': 'B', 'icon:bgColor': '#ff000' } } };
			const html = helpers.renderDigestAvatar(block);
			assert.equal(html, `<div style="vertical-align: middle; width: 32px; height: 32px; line-height: 32px; font-size: 16px; background-color: ${block.teaser.user['icon:bgColor']}; color: white; text-align: center; display: inline-block; border-radius: 50%;">${block.teaser.user['icon:text']}</div>`);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const block = { user: { username: 'baris', picture: '/uploads/1.png' } };
			const html = helpers.renderDigestAvatar(block);
			assert.equal(html, `<img style="vertical-align: middle; width: 32px; height: 32px; border-radius: 50%;" src="${block.user.picture}" title="${block.user.username}" />`);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const block = { user: { username: 'baris', 'icon:text': 'B', 'icon:bgColor': '#ff000' } };
			const html = helpers.renderDigestAvatar(block);
			assert.equal(html, `<div style="vertical-align: middle; width: 32px; height: 32px; line-height: 32px; font-size: 16px; background-color: ${block.user['icon:bgColor']}; color: white; text-align: center; display: inline-block; border-radius: 50%;">${block.user['icon:text']}</div>`);
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const html = helpers.userAgentIcons({ platform: 'Linux', browser: 'Chrome' });
			assert.equal(html, '<i class="fa fa-fw fa-linux"></i><i class="fa fa-fw fa-chrome"></i>');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const html = helpers.userAgentIcons({ platform: 'Microsoft Windows', browser: 'Firefox' });
			assert.equal(html, '<i class="fa fa-fw fa-windows"></i><i class="fa fa-fw fa-firefox"></i>');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const html = helpers.userAgentIcons({ platform: 'Apple Mac', browser: 'Safari' });
			assert.equal(html, '<i class="fa fa-fw fa-apple"></i><i class="fa fa-fw fa-safari"></i>');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const html = helpers.userAgentIcons({ platform: 'Android', browser: 'IE' });
			assert.equal(html, '<i class="fa fa-fw fa-android"></i><i class="fa fa-fw fa-internet-explorer"></i>');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const html = helpers.userAgentIcons({ platform: 'iPad', browser: 'Edge' });
			assert.equal(html, '<i class="fa fa-fw fa-tablet"></i><i class="fa fa-fw fa-edge"></i>');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const html = helpers.userAgentIcons({ platform: 'iPhone', browser: 'unknow' });
			assert.equal(html, '<i class="fa fa-fw fa-mobile"></i><i class="fa fa-fw fa-question-circle"></i>');
			resolve();
		} catch (error) {
			reject(error);
		}
	});

	new Promise((resolve, reject) => {
		try {
			const html = helpers.userAgentIcons({ platform: 'unknow', browser: 'unknown' });
			assert.equal(html, '<i class="fa fa-fw fa-question-circle"></i><i class="fa fa-fw fa-question-circle"></i>');
			resolve();
		} catch (error) {
			reject(error);
		}
	});
});
