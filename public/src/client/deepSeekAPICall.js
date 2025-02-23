const { HfInference } = require('@huggingface/inference');

const apiAccessToken = process.env.DEEPSEEK_API_ACCESS_TOKEN;
const client = new HfInference(apiAccessToken);

const getAPIResponse = async (question) => {
	const chatCompletion = await client.chatCompletion({
		model: 'deepseek-ai/DeepSeek-R1',
		messages: [
			{
				role: 'user',
				content: question,
			},
		],
		provider: 'together',
		max_tokens: 500,
	});
	return chatCompletion.choices[0].message.content;
};

module.exports = getAPIResponse;
