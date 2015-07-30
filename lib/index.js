var selectn = require('selectn');

var Boom = require('boom');
var Hoek = require('hoek');

exports.register = function(plugin, pluginOptions, next) {
  plugin.auth.scheme('ownership-access', function(server, options) {
    Hoek.assert(options, 'Missing options for ownership-access strategy');
    Hoek.assert(options.rules, 'Missing options.rules for ownership-access stategy');

    var settings = Hoek.clone(options);
    var errorMessage = options.errorMessage || 'You do not have access to this resource';

    var scheme = {
      authenticate: function(request, reply) {
        var doAuth = function(credentials) {
          var ruleName = selectn('plugins.hapiAuthOwnership.ownershipRule', request.route.settings);

          if (!ruleName) {
            // Authorized
            return reply.continue({
              credentials: credentials
            });
          }

          var rule = settings.rules[ruleName];
          Hoek.assert(rule, 'Rule \'' + ruleName + '\' not found for ownership-access strategy; check the options.rules object');

          rule(request, credentials, function(error, isValid, newCredentials) {
            if (error) {
              return reply(error);
            }

            var result = {
              credentials: newCredentials || credentials
            };

            if (!isValid) {
              return reply(Boom.unauthorized(errorMessage), null, result);
            }

            // Authorized
            reply.continue(result);
          });
        };

        if (options.companionStrategy) {
          server.auth.test(options.companionStrategy, request, function(error, credentials) {
            if (error) {
              return reply(error);
            }

            doAuth(credentials);
          });
        } else {
          doAuth({});
        }
      }
    };

    return scheme;
  });

  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};
