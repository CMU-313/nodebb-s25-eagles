'use strict';

// random number generating function for creating anon uid
// sourced from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = function (User) {
  // function that creates secondary anonymous account
  User.anonCreate = async function (data) {
    const tempUser = data.username.concat(getRandomInt(100000, 999999));
    const anonAcc = {         // anon account template
      uid: 0,
      username: tempUser,
      displayname: 'Anonymous',
      userslug: '',
      fullname: 'Anonymous',
      email: data.email,
      'icon:text': '?',
      'icon:bgColor': '#aaa',
      groupTitle: '',
      groupTitleArray: [],
      status: 'offline',
      reputation: 0,
      'email:confirmed': data['email:confirmed'],
    };
    data.anonUID = tempUser;
    try {
      // Create the anonymous account
      await User.create(anonAcc);
      console.log("Anonymous account created with UID:", tempUser);
    } catch (error) {
      console.error("Error creating anonymous account:", error);
      throw error; // Or handle as needed
    }
  };
    // function that creates group dedicated to just anonymous accounts
    
};