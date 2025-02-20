'use strict';

(function (window, document) {
	window.doStuff = function () {
		document.body.innerHTML = 'Stuff has been done';
	};
// eslint-disable-next-line no-undef
}(typeof window !== 'undefined' ? window : this, document));
