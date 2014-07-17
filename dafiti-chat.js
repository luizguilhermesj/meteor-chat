// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Chat = new Meteor.Collection("chat");
Users = Meteor.users;

var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };

  return events;
};
if (Meteor.isClient) {
  Meteor.subscribe("userData");
  Users.find({'status.online' : true}).observeChanges({
    added: function(id,user){
      if(!user.status.online){
        Chat.insert({name: '', message: user.username + ' joined Dafiti Chat.'});
      }
    },
    removed: function(){
        Chat.insert({name: '', message: Meteor.user().username + ' has left Dafiti Chat.'});
    }
  });
  Template.chat.users = function () {
    return Users.find({'status.online':true});
  };
  Template.user.userActive = function (id) {
    console.log(id);
    if(Meteor.user.status != undefined){
      if(Meteor.user.status.online){
        return 'active';
      }
    }
    return '';
  };
  Template.chat.events({
    'click button.send-button': function () {
      if(document.getElementById('message').value != ''){
        Chat.insert({name: Meteor.user().username, message: document.getElementById('message').value});
        document.getElementById('message').value = '';
      }
    }
  });
  Template.chat.chat_message = function () {
    return Chat.find({});
  };
  Template.chat.rendered = function () {
        var box = document.querySelector('.chat');
        box.scrollTop = box.scrollHeight + 100;
  };

  Template.chat.events(okCancelEvents(
  '#message',
  {
    ok: function (value) {
      if(document.getElementById('message').value != ''){
        Chat.insert({name: Meteor.user().profile.name, message: document.getElementById('message').value});
        document.getElementById('message').value = '';
      }
    },
    cancel: function () {
      Session.set('editing_itemname', null);
    }
  }));

  Accounts.ui.config({
    passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
  });
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.publish("userData", function () {
    return Users.find({},{fields: {'status.online': 1}});
  });
}

