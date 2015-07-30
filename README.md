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

An `ownership-access` strategy should be used with a companion strategy such as [hapi-auth-basic](https://github.com/hapijs/hapi-auth-basic). The companion strategy runs before and performs request authentication. Once you know who (e.g. the owner of the resource or someone else) is making the request, you can allow or deny access.

```javascript
server.register(require('hapi-auth-ownership'), function (err) {
  server.auth.strategy('ownership', 'ownership-access', {
    rules: {
      account: function(request, credentials, callback) {
        callback(null, request.params.id === credentials.account.id); // [1]
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: '/account/{id}',
    config: {
      plugins: {
        hapiAuthOwnership: {
          ownershipRule: 'account' // [2]
        }
      }
    }
  });
});
```

1. The authenticated user only has access to their own account.

2. Specify the rule to use. This will be taken from the `options.rules` object. If you don't specify an `ownershipRule` the request will be validated => the client has access.

When registering the plugin you can also specify `errorMessage`, which is the error message that will be sent on invalid requests. By default, it's set to `You do not have access to this resource`.
