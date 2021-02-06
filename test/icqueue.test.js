const SandboxedModule = require('sandboxed-module');
const { expect } = require('chai');
require('chai').use(require('chai-as-promised'));
require('chai').use(require('dirty-chai'));
require('chai').use(require('sinon-chai'));

const config = require('./config');
const ICQueue = require('../icqueue');

describe('ICQueue', function () {
  describe('#constructor', function () {
    it('should throw with empty constructor', function () {
      expect(() => new ICQueue()).to.throw('ICQueue: Invalid config');
    });

    it('should throw with no url or exchange', function () {
      expect(() => new ICQueue({})).to.throw('ICQueue: Invalid config');
    });

    it('should throw with no url', function () {
      expect(() => new ICQueue({ exchange: '' })).to.throw('ICQueue: Invalid config');
    });

    it('should throw with no exchange', function () {
      expect(() => new ICQueue({ url: '' })).to.throw('ICQueue: Invalid config');
    });
  });

  describe('#connect', function () {
    it('should should fail to connect to bad endpoint', function (done) {
      const icq = new ICQueue({
        url: 'amqp://guest:guest@localhost:6767',
        exchange: 'FOO'
      });
      icq.connect().catch(function (err) {
        expect(err.code).to.equal('ECONNREFUSED');
        done();
      });
    });

    it('should return a promise', async function () {
      const icq = new ICQueue(config.good);
      expect(icq.connect()).to.be.fulfilled();
    });

    it('should declare your queue, and bind it', async function () {
      const amqpLibMock = require('./amqplibmock')();
      const MockedICQueue = SandboxedModule.require('../icqueue', {
        requires: {
          amqplib: amqpLibMock.mock
        }
      });
      const mockedICQueue = new MockedICQueue(config.good);

      await mockedICQueue.connect();
      // one queue, dead lettered
      expect(amqpLibMock.assertQueueSpy.callCount).to.equal(2);
      // Bind the consume queue, and its dead letter queue.
      expect(amqpLibMock.bindQueueSpy).to.have.been.calledWith(config.good.queue.name, config.good.exchange, config.good.queue.routingKey);
      expect(amqpLibMock.bindQueueSpy.callCount).to.equal(2);
    });

    it('allows you to specify an array for routingKey and binds each given', function (done) {
      const amqpLibMock = require('./amqplibmock')();
      const MockedICQueue = SandboxedModule.require('../icqueue', {
        requires: {
          amqplib: amqpLibMock.mock
        }
      });
      const mockedICQueue = new MockedICQueue(config.routingKeyArray);

      mockedICQueue.connect().then(function () {
        // one queue, dead lettered
        expect(amqpLibMock.assertQueueSpy.callCount).to.equal(2);
        // Bind the consume queue with its two routing keys, and its dead
        // letter queue.
        expect(amqpLibMock.bindQueueSpy.callCount).to.equal(4);
        done();
      }).catch(done);
    });

    it('should just declare if you don\'t specify routing key', function (done) {
      const amqpLibMock = require('./amqplibmock')();
      const MockedICQueue = SandboxedModule.require('../icqueue', {
        requires: {
          amqplib: amqpLibMock.mock
        }
      });
      const mockedICQueue = new MockedICQueue(config.noRoutingKey);

      mockedICQueue.connect().then(function () {
        // one queue, not dead lettered
        expect(amqpLibMock.assertQueueSpy.callCount).to.equal(1);
        // No binding.
        expect(amqpLibMock.bindQueueSpy.callCount).to.equal(0);
        done();
      }).catch(done);
    });
  });

  describe('#publish', function () {
    it('should resolve successfully', async function () {
      const icq = new ICQueue(config.good);
      await icq.connect();
      await expect(icq.publish('myqueue', 'test', {})).to.eventually.be.fulfilled();
    });

    it('should accept objects', async function () {
      const icq = new ICQueue(config.good);
      await icq.connect();
      await expect(icq.publish('myqueue', { woo: 'test' }, {})).to.eventually.be.fulfilled();
    });
  });

  describe('#consume', async function () {
    it('if done(err) is called with err === null, calls ack().', function (done) {
      const ack = function () {
        done();
      };

      const amqpLibMock = require('./amqplibmock')({ overrides: { ack: ack } });
      const MockedICQueue = SandboxedModule.require('../icqueue', {
        requires: {
          amqplib: amqpLibMock.mock
        }
      });
      const mockedICQueue = new MockedICQueue(config.good);

      function myMessageHandler (parsedMsg, cb) {
        cb();
      }

      mockedICQueue.connect().then(function () {
        mockedICQueue.consume(myMessageHandler);
      }).catch((done));
    });

    it('if json unparsable, calls nack() with requeue of false.', function (done) {
      const nack = function (message, upTo, requeue) {
        expect(requeue).to.equal(false);
        done();
      };

      const amqpLibMock = require('./amqplibmock')({
        messageToDeliver: 'nonvalidjson',
        overrides: { nack: nack }
      });

      const MockedICQueue = SandboxedModule.require('../icqueue', {
        requires: {
          amqplib: amqpLibMock.mock
        }
      });
      const mockedICQueue = new MockedICQueue(config.good);

      function myMessageHandler (parsedMsg, cb) {
        cb();
      }

      mockedICQueue.connect().then(function () {
        mockedICQueue.consume(myMessageHandler);
      }).catch(done);
    });

    it('if json callback called with err, calls nack() with requeue as given.',
      function (done) {
        const nack = function (message, upTo, requeue) {
          expect(requeue).to.equal('requeue');
          done();
        };

        const amqpLibMock = require('./amqplibmock')({ overrides: { nack: nack } });

        const MockedICQueue = SandboxedModule.require('../icqueue', {
          requires: {
            amqplib: amqpLibMock.mock
          }
        });
        const mockedICQueue = new MockedICQueue(config.good);

        function myMessageHandler (parsedMsg, cb) {
          cb(new Error('got it bad'), 'requeue');
        }

        mockedICQueue.connect().then(function () {
          mockedICQueue.consume(myMessageHandler);
        }).catch(done);
      });
  });

  describe('#close', function () {
    it('should close the connection', async function () {
      const amqpLibMock = require('./amqplibmock')();
      const MockedICQueue = SandboxedModule.require('../icqueue', {
        requires: {
          amqplib: amqpLibMock.mock
        }
      });

      const icq = new MockedICQueue(config.good);
      await icq.connect();
      await icq.close();
      expect(amqpLibMock.closeConnectionSpy).to.have.been.called();
    });
  });
});

// vim: set et sw=2 colorcolumn=80:
