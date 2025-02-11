const { JSDOM } = require('jsdom');

const dom = new JSDOM(`
  <div component="topic">
    <div data-pid="1">Post 1</div>
    <div data-pid="2">Post 2</div>
    <div data-pid="3">Post 3</div>
  </div>
`);

const document = dom.window.document;

// Import Jest functions
const { describe, test, expect, beforeEach } = require('@jest/globals');

// ✅ Function to get data attribute
function getDataAttribute(button, attribute) {
	return button.getAttribute(attribute);
}

// ✅ The function we're testing
async function onPinClicked(button) {
	const pid = getDataAttribute(button, 'data-pid');
	const container = document.querySelector('[component="topic"]');
	const currentPost = container.querySelector(`[data-pid='${pid}']`);

	if (currentPost) { // Ensure the post exists
		const firstPost = container.firstChild;
		container.insertBefore(currentPost, firstPost);
	}
}

// ✅ Jest Test Cases
describe('onPinClicked', () => {
	// Mock DOM structure before each test
	beforeEach(() => {
		document.body.innerHTML = `
			<div component="topic">
				<div data-pid="1">Post 1</div>
				<div data-pid="2">Post 2</div>
				<div data-pid="3">Post 3</div>
			</div>
		`;
	});

	test('pins the selected post to the top', async () => {
		const button = document.createElement('button');
		button.setAttribute('data-pid', '3');

		await onPinClicked(button);

		const container = document.querySelector('[component="topic"]');
		expect(container.children[0].getAttribute('data-pid')).toBe('3');
		expect(container.children[1].getAttribute('data-pid')).toBe('1');
		expect(container.children[2].getAttribute('data-pid')).toBe('2');
	});

	test('no change when clicking the first post', async () => {
		const button = document.createElement('button');
		button.setAttribute('data-pid', '1');

		await onPinClicked(button);

		const container = document.querySelector('[component="topic"]');
		expect(container.children[0].getAttribute('data-pid')).toBe('1');
		expect(container.children[1].getAttribute('data-pid')).toBe('2');
		expect(container.children[2].getAttribute('data-pid')).toBe('3');
	});

	test('handles invalid data-pid gracefully', async () => {
		const button = document.createElement('button');
		button.setAttribute('data-pid', '999'); // Non-existent pid

		await onPinClicked(button);

		const container = document.querySelector('[component="topic"]');
		expect(container.children[0].getAttribute('data-pid')).toBe('1');
		expect(container.children[1].getAttribute('data-pid')).toBe('2');
		expect(container.children[2].getAttribute('data-pid')).toBe('3');
	});
});
