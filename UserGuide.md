New Features:

Anonymous Posting:
-

- This new added feature allows user to make post and replies anonymously given that admin has enable anonymously posting.
- For admin to enable the anonymous posting, admin can go to the post setting in the admin portal and toggle on the enable anonymous post setting.  One thing to note, admin need to make sure the any changes is saved for the changes be applied to the server and make sure when click save, the save button turn green or else it means the changes are not saved.
- Given that the admins have enable anonymous posting, users can see there is a fifth status, anonymous, for users to choose from.  When users are on anonymous status, anything they post will not reveal their user information.  The post will have no avator picture by the user and user's username will not be shown.  Also, when the users are on anonymous status, their status bubble is going to be the color black.  One thing to note for this feature is for any reply to be shown correct, users need to refresh the page for actual reply information.

Testing for Anonymous Posting:
- Tests were implemented for the anonymous posting functionality. They can be found in `test/user.js`.
The tests specifically ensure 
- account status will properly change when switching a user to anonymous mode and vice versa
- ensuring that anonymous mode is not accessible when the admin settings have it disabled
These tests were implemented in the test files designated for status related tests. They can be run utilizing the `npm run test` command.

Autonomous Reply (Currently Disabled):
-

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

Pin Reply (Not fully working):
-

- This new added feature allows users to pin a preexisting reply to any NodeBB post. If you no longer want that reply to be pinned, you must click the "pin icon" on a different reply, or make a new reply and pin that one.

- onPinClicked is the specific function that was tested.

1. First test: What ever post is selected is pinned to the top of the list of replies
2. Second test: If you clicked on a pinned post again, it is not unpinned
3. Third test: The function gracefully handles invalid Post IDs.

Translation:
-
-This new added feature allows users to translate a non-English post into English. The user can click on the button appears under the post to see the translated content and click on the button again to hide the translation.
<img width="1440" alt="image" src="https://github.com/user-attachments/assets/0b773de0-308c-4f3c-bed2-db744804fc76" />


Testing for Translation
- The first test checks if the LLM returns the expected output for a specific sentence in a specific language.
- The second test checks that no translation will be made to gibberish inputs.
- There is also some unit and mock tests.  The mock tests test whether the translation API call can handle unexpected behaviors and responses from the LLM.
- The tests are located here https://github.com/ChristinaTrinh/translator-service-eagles/blob/f24/test/unit/test_translator.py
