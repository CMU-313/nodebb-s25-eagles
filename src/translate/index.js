'use strict';

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
	const TRANSLATOR_API = 'http://localhost:5000/';
	try {
		const response = await fetch(`${TRANSLATOR_API}/?content=${postData.content}`);
		const data = await response.json();
		console.log(data);
		if (!data || data.is_english === undefined || data.translated_content === undefined) {
			return [true, postData.content];
		}
		return [data.is_english, data.translated_content];
	} catch (someError) {
		console.error(someError);
		return [true, postData.content];
	}
};
