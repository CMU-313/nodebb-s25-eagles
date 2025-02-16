'use strict';

const { JSDOM } = require('jsdom');
const { describe, test, expect, beforeEach } = require('@jest/globals');

// Jest Test Cases
describe('onPinClicked', () => {
	let document;

	// Setup a fresh DOM before each test
	beforeEach(() => {
		const dom = new JSDOM(`
			<div component="topic">
				<div data-pid="1">Post 1</div>
				<div data-pid="2">Post 2</div>
				<div data-pid="3">Post 3</div>
			</div>
		`);
		document = dom.window.document;
	});

	// Function to get data attribute
	function getDataAttribute(button, attribute) {
		return button.getAttribute(attribute);
	}

	// The function we're testing (returns a Promise)
	async function onPinClicked(button) {
		const pid = getDataAttribute(button, 'data-pid');
		const container = document.querySelector('[component="topic"]');
		const currentPost = container.querySelector(`[data-pid='${pid}']`);

		if (currentPost && currentPost !== container.firstChild) {
			container.insertBefore(currentPost, container.firstChild);
		}

		// Ensure async behavior completes correctly.
		return Promise.resolve();
	}

	test('pins the last post to the top', async () => {
		const button = document.createElement('button');
		button.setAttribute('data-pid', '3');

		await onPinClicked(button);

		const container = document.querySelector('[component="topic"]');
		expect(container.children.length).toBe(3); // Ensures no elements were added/removed.
		expect(container.children[0].getAttribute('data-pid')).toBe('3');
		expect(container.children[1].getAttribute('data-pid')).toBe('1');
		expect(container.children[2].getAttribute('data-pid')).toBe('2');
	});

	test('does not move the first post when pinned', async () => {
		const button = document.createElement('button');
		button.setAttribute('data-pid', '1');

		await onPinClicked(button);

		const container = document.querySelector('[component="topic"]');
		expect(container.children.length).toBe(3);
		expect(container.children[0].getAttribute('data-pid')).toBe('1');
		expect(container.children[1].getAttribute('data-pid')).toBe('2');
		expect(container.children[2].getAttribute('data-pid')).toBe('3');
	});

	test('handles non-existent post IDs gracefully', async () => {
		const button = document.createElement('button');
		button.setAttribute('data-pid', '999'); // Non-existent pid.

		await onPinClicked(button);

		const container = document.querySelector('[component="topic"]');
		expect(container.children.length).toBe(3);
		expect(container.children[0].getAttribute('data-pid')).toBe('1');
		expect(container.children[1].getAttribute('data-pid')).toBe('2');
		expect(container.children[2].getAttribute('data-pid')).toBe('3');
	});

	test('does nothing when no data-pid attribute is provided', async () => {
		const button = document.createElement('button'); // No `data-pid` set.

		await onPinClicked(button);

		const container = document.querySelector('[component="topic"]');
		expect(container.children.length).toBe(3);
		expect(container.children[0].getAttribute('data-pid')).toBe('1');
		expect(container.children[1].getAttribute('data-pid')).toBe('2');
		expect(container.children[2].getAttribute('data-pid')).toBe('3');
	});
});
