var Code = require('code');
var Hapi = require('hapi');
var Lab = require('lab');

// Test shortcuts
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;

it('returns a reply on successful auth', function(done) {
  var server = new Hapi.Server();
  server.connection();
  server.register(require('../'), function(err) {
    expect(err).to.not.exist();

    server.auth.strategy('ownership', 'ownership-access', 'required', {
      rules: {
        account: function(request, credentials, callback) {
          callback(null, request.params.id === '123');
        }
      }
    });

    server.route({
      method: 'POST',
      path: '/account/{id}',
      handler: function(request, reply) {
        return reply('ok');
      },
      config: {
        auth: 'ownership',
        plugins: {
          hapiAuthOwnership: {
            ownershipRule: 'account'
          }
        }
      }
    });

    var request = {
      method: 'POST',
      url: '/account/123'
    };

    server.inject(request, function(res) {
      expect(res.result).to.equal('ok');
      done();
    });
  });
});

it('returns an error on unsuccessful auth', function(done) {
  var server = new Hapi.Server();
  server.connection();
  server.register(require('../'), function(err) {
    expect(err).to.not.exist();

    server.auth.strategy('ownership', 'ownership-access', 'required', {
      rules: {
        account: function(request, credentials, callback) {
          callback(null, request.params.id === '456');
        }
      }
    });

    server.route({
      method: 'POST',
      path: '/account/{id}',
      handler: function(request, reply) {
        return reply('ok');
      },
      config: {
        auth: 'ownership',
        plugins: {
          hapiAuthOwnership: {
            ownershipRule: 'account'
          }
        }
      }
    });

    var request = {
      method: 'POST',
      url: '/account/123'
    };

    server.inject(request, function(res) {
      expect(res.statusCode).to.equal(401);
      done();
    });
  });
});

it('returns the custom error message if set', function(done) {
  var server = new Hapi.Server();
  server.connection();
  server.register(require('../'), function(err) {
    expect(err).to.not.exist();

    server.auth.strategy('ownership', 'ownership-access', 'required', {
      rules: {
        account: function(request, credentials, callback) {
          callback(null, request.params.id === '456');
        }
      },
      errorMessage: 'OOPS'
    });

    server.route({
      method: 'POST',
      path: '/account/{id}',
      handler: function(request, reply) {
        return reply('ok');
      },
      config: {
        auth: 'ownership',
        plugins: {
          hapiAuthOwnership: {
            ownershipRule: 'account'
          }
        }
      }
    });

    var request = {
      method: 'POST',
      url: '/account/123'
    };

    server.inject(request, function(res) {
      expect(res.result.message).to.equal('OOPS');
      done();
    });
  });
});

it('returns a custom credentials object', function(done) {
  var server = new Hapi.Server();
  server.connection();
  server.register(require('../'), function(err) {
    expect(err).to.not.exist();

    server.auth.strategy('ownership', 'ownership-access', 'required', {
      rules: {
        account: function(request, credentials, callback) {
          callback(null, request.params.id === '123', {
            user: 'superman'
          });
        }
      }
    });

    server.route({
      method: 'POST',
      path: '/account/{id}',
      handler: function(request, reply) {
        return reply(request.auth.credentials.user);
      },
      config: {
        auth: 'ownership',
        plugins: {
          hapiAuthOwnership: {
            ownershipRule: 'account'
          }
        }
      }
    });

    var request = {
      method: 'POST',
      url: '/account/123'
    };

    server.inject(request, function(res) {
      expect(res.result).to.equal('superman');
      done();
    });
  });
});

it('works without a rule', function(done) {
  var server = new Hapi.Server();
  server.connection();
  server.register(require('../'), function(err) {
    expect(err).to.not.exist();

    server.auth.strategy('ownership', 'ownership-access', 'required', {
      rules: {}
    });

    server.route({
      method: 'POST',
      path: '/account/{id}',
      handler: function(request, reply) {
        return reply('ok');
      },
      config: {
        auth: 'ownership',
        plugins: {
          hapiAuthOwnership: {
            ownershipRule: ''
          }
        }
      }
    });

    var request = {
      method: 'POST',
      url: '/account/123'
    };

    server.inject(request, function(res) {
      expect(res.result).to.equal('ok');
      done();
    });
  });
});

it('survives if the rule handler throws an error', function(done) {
  var server = new Hapi.Server();
  server.connection();
  server.register(require('../'), function(err) {
    expect(err).to.not.exist();

    server.auth.strategy('ownership', 'ownership-access', 'required', {
      rules: {
        account: function(request, credentials, callback) {
          callback(new Error('humpty dumpty'));
        }
      }
    });

    server.route({
      method: 'POST',
      path: '/account/{id}',
      handler: function(request, reply) {
        return reply('ok');
      },
      config: {
        auth: 'ownership',
        plugins: {
          hapiAuthOwnership: {
            ownershipRule: 'account'
          }
        }
      }
    });

    var request = {
      method: 'POST',
      url: '/account/123'
    };

    server.inject(request, function(res) {
      expect(res.statusCode).to.equal(500);
      done();
    });
  });
});

it('works with already provided credentials from the companion strategy', function(done) {
  var server = new Hapi.Server();
  server.connection();
  server.register(require('../'), function(err) {
    expect(err).to.not.exist();

    server.auth.strategy('companion', 'ownership-access', {
      rules: {
        account: function(request, credentials, callback) {
          callback(null, true, {
            account: {
              id: '123'
            }
          });
        }
      }
    });

    server.auth.strategy('ownership', 'ownership-access', {
      rules: {
        account: function(request, credentials, callback) {
          callback(null, request.params.id === credentials.account.id);
        }
      },
      companionStrategy: 'companion'
    });

    server.route({
      method: 'POST',
      path: '/account/{id}',
      handler: function(request, reply) {
        return reply('ok');
      },
      config: {
        auth: 'ownership',
        plugins: {
          hapiAuthOwnership: {
            ownershipRule: 'account'
          }
        }
      }
    });

    var request = {
      method: 'POST',
      url: '/account/123'
    };

    server.inject(request, function(res) {
      expect(res.result).to.equal('ok');
      done();
    });
  });
});

it('works if the companion strategy throws an error', function(done) {
  var server = new Hapi.Server();
  server.connection();
  server.register(require('../'), function(err) {
    expect(err).to.not.exist();

    server.auth.strategy('companion', 'ownership-access', {
      rules: {
        account: function(request, credentials, callback) {
          callback(new Error('blah blah'));
        }
      }
    });

    server.auth.strategy('ownership', 'ownership-access', {
      rules: {
        account: function(request, credentials, callback) {
          callback(null, request.params.id === credentials.account.id);
        }
      },
      companionStrategy: 'companion'
    });

    server.route({
      method: 'POST',
      path: '/account/{id}',
      handler: function(request, reply) {
        return reply('ok');
      },
      config: {
        auth: 'ownership',
        plugins: {
          hapiAuthOwnership: {
            ownershipRule: 'account'
          }
        }
      }
    });

    var request = {
      method: 'POST',
      url: '/account/123'
    };

    server.inject(request, function(res) {
      expect(res.statusCode).to.equal(500);
      done();
    });
  });
});
