'use strict';
// random number generating function for creating anon uid
// sourced from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
const utils = { ...require('../public/src/utils.common') };


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; 
  }
  const anon = 'anonymous'

module.exports = function (User) {
  // function that creates secondary anonymous account
  User.anonCreate = async function (data) {
    const tempUID = utils.generateUUID
    const tempUser = anon.concat(tempUID);
    const anonAcc = {         // anon account template
      uid: tempUID,
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
    data.anon = tempUID;
    try {
      // Create the anonymous account
      await User.create(anonAcc);
      console.log("Anonymous account created with username: ", tempUser);
    } catch (error) {
      console.error("Error creating anonymous account: ", error);
      throw error; // Or handle as needed
    }
  };
  // function that creates group dedicated to just anonymous accounts
  // account switching function
  Account.switch = async function (req, res, uid) {
    try {
      // checking for valid user session
      if (!req.session) {
        throw new Error('No active session.');
      }
      // update request with anon UID
      req.uid = uid
      const anonData = await getUserData(uid)
      req.userData = anonData
      // obtaining anonymous account info
      await updateUserSession(req);
      // redirects user after log in
      res.status(200).send({ message: 'Switched to anonymous mode.'});
    } catch (err) {
      res.status.(500).send({message: 'Error switching accounts', error: err.message});
    }
  }
};