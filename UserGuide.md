New Features:

Anonymous Posting

Autonomous Reply:

- This new added feature is straightforward to use and do not need extra effort from the user because a chatbot named "Romeo SmartBuddy" will automatically post a reply to a new topic that the user creates across any channel in the NodeBB instance.
- However, in order for this feature to work correctly, the codebase need to have a valid API Access Token. The reason for this is because Romeo SmartBuddy was implemented to make API call to a DeepSeek LLM endpoint to get a response to the content that the user input.

1. Steps to get a valid API Access Token:
   a. Go to 'Hugging Face' website (https://huggingface.co/)
   b. Create a new account (eg. with an email address)
   c. You will receive a confirmation email, click on the link to confirm
   d. After successfully logged into your newly created account, click on your profile picture on the top right corner
   e. Select 'Access Tokens'
   f. Click on 'Create New Token'
   g. Select 'Write' option (3 options in total: Fine-grained, Read, Write)
   h. Give your new token a name (any name works)
   i. Hit 'Create token'
   j. Copy onto your clipboard
2. Steps to use the created API Access Token:
   a. Go to public/src/client/deepSeekAPICall.js
   b. Look for: const apiAccessToken = process.env.DEEPSEEK_API_ACCESS_TOKEN;
   c. Replace 'process.env.DEEPSEEK_API_ACCESS_TOKEN' with the API Access Token that you copied into clipboard earlier on step 1j.
   d. Now, you should be able to see how the feature works by running the commands ./nodebb build -> ./nodebb start -> make a new topic in any of the existing channel in your NodeBB instance.

Important Note:

1. Your free Hugging Face account gives a limited number of API calls that you can make, therefore, the API Access Token will NOT work for infinite number of new topics. Therefore, you need to create a new account every time you run out of quota if you do not want to pay for it.
2. This is the reason that we could not write automated test cases for this new feature because it will need an infinite number of Hugging Face accounts.

Pin Reply
