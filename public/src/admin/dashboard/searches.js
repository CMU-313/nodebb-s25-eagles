'use strict';

const createACPModule = (alert, ajaxify, socket, $) => {
	const handleError = (err) => {
		if (err) {
			return alert.error(err);
		}
		ajaxify.refresh();
	};
	const ACP = {
		init: () => {
			$('#clear-search-history').on('click', () => {
				bootbox.confirm('[[admin/dashboard:clear-search-history-confirm]]', function (ok) {
					if (ok) {
						socket.emit('admin.clearSearchHistory', handleError);
					}
				});
			});
		},
	};
	return { handleError, ACP };
};

module.exports = createACPModule;
