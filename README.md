# hapi-auth-ownership

[![Build Status](https://secure.travis-ci.org/Aluxian/hapi-auth-ownership.svg)](http://travis-ci.org/Aluxian/hapi-auth-ownership)

Simple authentication scheme to verify resource ownership. Clients must pass the validation rule assigned to a route to be able to access it. The `ownership-access` scheme takes the following options:

- `rules` - (required) an object with rules; each rule is a function with the signature `function(request, credentials, callback)` where:
  - `request` - is the Hapi request object of the request which is being authenticated
  - `credentials` - the credentials object, taken from `request.auth.credentials`
  - `callback` - a callback function with the signature `function(err, isValid, credentials)` where:
      - `err` - an internal error
      - `isValid` - `true` if the client is granted access
      - `credentials` - a credentials object passed back to the application in `request.auth.credentials`; if you do not include this,
      the plugin will pass the previous credentials back to Hapi
- `errorMessage` - (optional) the error message that will be sent on invalid requests; set to `You do not have access to this resource` by default
- `companionStrategy` - (required) the strategy that will be used to retrieve `credentials`; this is required because ownership checks require a credentials object

```javascript
var users = {
  john: {
    id: '123',
    username: 'john',
    password: 'secret'
  }
};

var validate = function(request, username, password, callback) {
  var user = users[username];

  if (!user) {
    return callback(null, false);
  }

  callback(null, password === user.password, user);
};

server.register(require('hapi-auth-basic'), function(err) {
  server.auth.strategy('simple', 'basic', { validateFunc: validate }); // [1]

  server.register(require('hapi-auth-ownership'), function (err) {
    server.auth.strategy('ownership', 'ownership-access', {
      rules: {
        account: function(request, credentials, callback) {
          callback(null, request.params.id === credentials.account.id); // [2]
        }
      },
      errorMessage: 'OOPS!', // [3]
      companionStrategy: 'simple' // [4]
    });

    server.route({
      method: 'DELETE',
      path: '/account/{id}',
      config: {
        plugins: {
          hapiAuthOwnership: {
            ownershipRule: 'account' // [5]
          }
        }
      }
    });
  });
});
```

1. Define the companion strategy.
2. The authenticated user only has access to their own account.
3. Custom error message.
4. The credentials will be retrieved from this strategy.
5. Specify the rule to use. This will be taken from the `options.rules` object. If you don't specify an `ownershipRule` the request will be validated => the client has access.
