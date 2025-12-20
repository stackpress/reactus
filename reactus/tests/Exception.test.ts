//tests
import { describe, it } from 'mocha';
import { expect } from 'chai';
//reactus
import Exception from '../src/Exception.js';

describe('Exception', () => {
  describe('constructor', () => {
    it('creates an exception with message and default code', () => {
      const e = new Exception('hello');
      expect(e).to.be.instanceOf(Error);
      expect(e.message).to.equal('hello');
      expect(e.code).to.equal(500);
    });

    it('creates an exception with custom code', () => {
      const e = new Exception('hello', 404);
      expect(e.code).to.equal(404);
    });

    it('extends Error class', () => {
      const e = new Exception('boom');
      expect(e).to.be.instanceOf(Error);
      expect(e.name).to.equal('ReactusException');
    });
  });

  describe('static for()', () => {
    it('creates exception with template string', () => {
      const e = Exception.for('Hello %s', 'World');
      expect(e.message).to.equal('Hello World');
      expect(e).to.be.instanceOf(Exception);
    });

    it('handles multiple template parameters', () => {
      const e = Exception.for('%s-%s-%s', 'a', 'b', 'c');
      expect(e.message).to.equal('a-b-c');
    });

    it('handles no template parameters', () => {
      const e = Exception.for('no params');
      expect(e.message).to.equal('no params');
    });
  });

  describe('static forResponse()', () => {
    it('creates exception from response object', () => {
      const e = Exception.forResponse({ code: 400, error: 'Bad', errors: { name: 'required' } });
      expect(e.code).to.equal(400);
      expect(e.message).to.equal('Bad');
      expect(e.errors).to.deep.equal({ name: 'required' });
    });

    it('uses fallback message when error is not provided', () => {
      const e = Exception.forResponse({ code: 400 }, 'fallback');
      expect(e.code).to.equal(400);
      expect(e.message).to.equal('fallback');
    });

    it('uses default message when neither error nor fallback provided', () => {
      const e = Exception.forResponse({ code: 400 });
      expect(e.code).to.equal(400);
      expect(e.message).to.equal('');
    });
  });

  describe('static forErrors()', () => {
    it('creates exception for validation errors', () => {
      const e = Exception.forErrors({ email: 'invalid' });
      expect(e.message).to.equal('Invalid Parameters');
      expect(e.errors).to.deep.equal({ email: 'invalid' });
    });

    it('handles empty errors object', () => {
      const e = Exception.forErrors({});
      expect(e.errors).to.deep.equal({});
    });
  });

  describe('static require()', () => {
    it('does not throw when condition is true', () => {
      Exception.require(true, 'should not throw');
    });

    it('throws when condition is false', () => {
      try {
        Exception.require(false, 'nope');
        expect.fail('should have thrown');
      } catch (err: unknown) {
        expect(err).to.be.instanceOf(Exception);
      }
    });

    it('throws with template parameters', () => {
      try {
        Exception.require(false, 'Missing %s', 'field');
        expect.fail('should have thrown');
      } catch (err: unknown) {
        if (err instanceof Exception) {
          expect(err.message).to.equal('Missing field');
        } else {
          throw err;
        }
      }
    });
  });

  describe('static upgrade()', () => {
    it('returns same exception if already Exception', () => {
      const e = new Exception('x');
      expect(Exception.upgrade(e)).to.equal(e);
    });

    it('upgrades regular Error to Exception', () => {
      const original = new Error('boom');
      const upgraded = Exception.upgrade(original, 501);
      expect(upgraded).to.be.instanceOf(Exception);
      expect(upgraded.message).to.equal('boom');
      expect(upgraded.code).to.equal(501);
    });

    it('uses default code when not provided', () => {
      const original = new Error('boom');
      const upgraded = Exception.upgrade(original);
      expect(upgraded.code).to.equal(500);
    });
  });

  describe('withCode()', () => {
    it('sets the error code', () => {
      const e = new Exception('x');
      e.withCode(403);
      expect(e.code).to.equal(403);
    });

    it('allows method chaining', () => {
      const e = new Exception('x');
      const chained = e.withCode(401);
      expect(chained).to.equal(e);
      expect(e.code).to.equal(401);
    });
  });

  describe('withErrors()', () => {
    it('sets validation errors', () => {
      const e = new Exception('x');
      e.withErrors({ name: 'required' });
      expect(e.errors).to.deep.equal({ name: 'required' });
    });

    it('handles array values in errors', () => {
      const e = new Exception('x');
      e.withErrors({ tags: ['a', 'b'] });
      expect(e.errors).to.deep.equal({ tags: ['a', 'b'] });
    });
  });

  describe('withPosition()', () => {
    it('sets start and end positions', () => {
      const e = new Exception('x');
      e.withPosition(10, 20);
      expect(e.start).to.equal(10);
      expect(e.end).to.equal(20);
    });
  });

  describe('toResponse()', () => {
    it('converts to response object', () => {
      const e = new Exception('x', 404);
      const response = e.toResponse();
      expect(response.code).to.equal(404);
      expect(response.error).to.equal('x');
      expect(response).to.have.property('status');
      expect(response).to.have.property('stack');
    });

    it('handles exception without errors', () => {
      const e = new Exception('x');
      const response = e.toResponse();
      expect(response).to.not.have.property('errors');
    });
  });

  describe('toJSON()', () => {
    it('returns formatted JSON string', () => {
      const e = new Exception('x', 400);
      const json = e.toJSON();
      expect(json).to.be.a('string');
      expect(JSON.parse(json)).to.have.property('code', 400);
    });
  });

  describe('trace()', () => {
    it('returns parsed stack trace', () => {
      const e = new Exception('x');
      const trace = e.trace();
      expect(trace).to.be.an('array');
    });

    it('handles start and end parameters', () => {
      const e = new Exception('x');
      const a = e.trace(0, 1);
      expect(a).to.be.an('array');
      expect(a.length).to.be.at.most(1);
    });
  });

  describe('integration', () => {
    it('works with method chaining', () => {
      const e = new Exception('x')
        .withCode(422)
        .withErrors({ name: 'required' })
        .withPosition(1, 2);

      expect(e.code).to.equal(422);
      expect(e.errors).to.deep.equal({ name: 'required' });
      expect(e.start).to.equal(1);
      expect(e.end).to.equal(2);
    });

    it('maintains error properties through conversion', () => {
      const e = new Exception('x', 418);
      const json = JSON.parse(e.toJSON());
      expect(json.code).to.equal(418);
      expect(json.error).to.equal('x');
    });
  });
});
