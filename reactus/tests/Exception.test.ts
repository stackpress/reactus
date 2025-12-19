import Exception from '../src/Exception.js';

describe('Exception', () => {
  describe('constructor', () => {
    it('should create an exception with message and default code', () => {
      const exception = new Exception('Test error');
      
      expect(exception.message).toBe('Test error');
      expect(exception.code).toBe(500);
      expect(exception.name).toBe('ReactusException');
    });

    it('should create an exception with custom code', () => {
      const exception = new Exception('Not found', 404);
      
      expect(exception.message).toBe('Not found');
      expect(exception.code).toBe(404);
    });

    it('should extend Error class', () => {
      const exception = new Exception('Test error');
      
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(Exception);
    });
  });

  describe('static for method', () => {
    it('should create exception with template string', () => {
      const exception = Exception.for('User %s not found', 'john');
      
      expect(exception.message).toBe('User john not found');
      expect(exception.code).toBe(500);
    });

    it('should handle multiple template parameters', () => {
      const exception = Exception.for('Error %s in %s at line %s', 'syntax', 'file.js', '42');
      
      expect(exception.message).toBe('Error syntax in file.js at line 42');
    });

    it('should handle no template parameters', () => {
      const exception = Exception.for('Simple error message');
      
      expect(exception.message).toBe('Simple error message');
    });
  });

  describe('static forResponse method', () => {
    it('should create exception from response object', () => {
      const response = {
        code: 400,
        error: 'Bad Request',
        errors: { field: 'required' }
      };
      
      const exception = Exception.forResponse(response);
      
      expect(exception.message).toBe('Bad Request');
      expect(exception.code).toBe(400);
      expect(exception.errors).toEqual({ field: 'required' });
    });

    it('should use fallback message when error is not provided', () => {
      const response = { code: 500 };
      
      const exception = Exception.forResponse(response, 'Fallback message');
      
      expect(exception.message).toBe('Fallback message');
      expect(exception.code).toBe(500);
    });

    it('should use default message when neither error nor fallback provided', () => {
      const response = { code: 422 };
      
      const exception = Exception.forResponse(response);
      
      expect(exception.message).toBe('');
      expect(exception.code).toBe(422);
    });
  });

  describe('static forErrors method', () => {
    it('should create exception for validation errors', () => {
      const errors = {
        name: 'required',
        email: 'invalid format'
      };
      
      const exception = Exception.forErrors(errors);
      
      expect(exception.message).toBe('Invalid Parameters');
      expect(exception.code).toBe(500);
      expect(exception.errors).toEqual(errors);
    });

    it('should handle empty errors object', () => {
      const exception = Exception.forErrors({});
      
      expect(exception.message).toBe('Invalid Parameters');
      expect(exception.code).toBe(500);
      expect(exception.errors).toEqual({});
    });
  });

  describe('static require method', () => {
    it('should not throw when condition is true', () => {
      expect(() => {
        Exception.require(true, 'Should not throw');
      }).not.toThrow();
    });

    it('should throw when condition is false', () => {
      expect(() => {
        Exception.require(false, 'Should throw');
      }).toThrow('Should throw');
    });

    it('should throw with template parameters', () => {
      expect(() => {
        Exception.require(false, 'Value %s is invalid', 'test');
      }).toThrow('Value test is invalid');
    });
  });

  describe('static upgrade method', () => {
    it('should return same exception if already Exception', () => {
      const original = new Exception('Test error', 400);
      const upgraded = Exception.upgrade(original, 500);
      
      expect(upgraded).toBe(original);
      expect(upgraded.code).toBe(400); // Should keep original code
    });

    it('should upgrade regular Error to Exception', () => {
      const error = new Error('Regular error');
      const upgraded = Exception.upgrade(error, 422);
      
      expect(upgraded).toBeInstanceOf(Exception);
      expect(upgraded.message).toBe('Regular error');
      expect(upgraded.code).toBe(422);
    });

    it('should use default code when not provided', () => {
      const error = new Error('Regular error');
      const upgraded = Exception.upgrade(error);
      
      expect(upgraded.code).toBe(500);
    });
  });

  describe('withCode method', () => {
    it('should set the error code', () => {
      const exception = new Exception('Test error');
      const result = exception.withCode(404);
      
      expect(result).toBe(exception); // Should return same instance
      expect(exception.code).toBe(404);
    });

    it('should allow method chaining', () => {
      const exception = new Exception('Test error')
        .withCode(400)
        .withErrors({ field: 'required' });
      
      expect(exception.code).toBe(400);
      expect(exception.errors).toEqual({ field: 'required' });
    });
  });

  describe('withErrors method', () => {
    it('should set validation errors', () => {
      const errors = { name: 'required', email: 'invalid' };
      const exception = new Exception('Test error');
      const result = exception.withErrors(errors);
      
      expect(result).toBe(exception);
      expect(exception.errors).toEqual(errors);
    });

    it('should handle array values in errors', () => {
      const errors = { 
        name: 'required',
        email: ['required', 'invalid format']
      };
      const exception = new Exception('Test error').withErrors(errors);
      
      expect(exception.errors).toEqual(errors);
    });
  });

  describe('withPosition method', () => {
    it('should set start and end positions', () => {
      const exception = new Exception('Parse error');
      const result = exception.withPosition(10, 20);
      
      expect(result).toBe(exception);
      expect(exception.start).toBe(10);
      expect(exception.end).toBe(20);
    });
  });

  describe('toResponse method', () => {
    it('should convert to response object', () => {
      const exception = new Exception('Test error', 400)
        .withErrors({ field: 'required' })
        .withPosition(5, 15);
      
      const response = exception.toResponse();
      
      expect(response.code).toBe(400);
      expect(response.status).toBe('Bad Request');
      expect(response.error).toBe('Test error');
      expect(response.errors).toEqual({ field: 'required' });
      expect(response.start).toBe(5);
      expect(response.end).toBe(15);
      expect(Array.isArray(response.stack)).toBe(true);
    });

    it('should handle exception without errors', () => {
      const exception = new Exception('Simple error', 404);
      const response = exception.toResponse();
      
      expect(response.code).toBe(404);
      expect(response.status).toBe('Not Found');
      expect(response.error).toBe('Simple error');
      expect(response.errors).toBeUndefined();
    });
  });

  describe('toJSON method', () => {
    it('should return formatted JSON string', () => {
      const exception = new Exception('Test error', 400)
        .withErrors({ field: 'required' });
      
      const json = exception.toJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.code).toBe(400);
      expect(parsed.error).toBe('Test error');
      expect(parsed.errors).toEqual({ field: 'required' });
    });
  });

  describe('trace method', () => {
    it('should return parsed stack trace', () => {
      const exception = new Exception('Test error');
      const trace = exception.trace();
      
      expect(Array.isArray(trace)).toBe(true);
      expect(trace.length).toBeGreaterThan(0);
      
      if (trace.length > 0) {
        expect(trace[0]).toHaveProperty('method');
        expect(trace[0]).toHaveProperty('file');
        expect(trace[0]).toHaveProperty('line');
        expect(trace[0]).toHaveProperty('char');
      }
    });

    it('should handle start and end parameters', () => {
      const exception = new Exception('Test error');
      const fullTrace = exception.trace();
      const partialTrace = exception.trace(1, 3);
      
      expect(partialTrace.length).toBeLessThanOrEqual(fullTrace.length);
    });
  });

  describe('integration', () => {
    it('should work with method chaining', () => {
      const exception = Exception.for('User %s not found', 'john')
        .withCode(404)
        .withErrors({ userId: 'invalid' })
        .withPosition(0, 10);
      
      expect(exception.message).toBe('User john not found');
      expect(exception.code).toBe(404);
      expect(exception.errors).toEqual({ userId: 'invalid' });
      expect(exception.start).toBe(0);
      expect(exception.end).toBe(10);
    });

    it('should maintain error properties through conversion', () => {
      const exception = new Exception('Test error', 422)
        .withErrors({ field1: 'error1', field2: 'error2' });
      
      const response = exception.toResponse();
      const json = exception.toJSON();
      const parsed = JSON.parse(json);
      
      expect(response.errors).toEqual(parsed.errors);
      expect(response.code).toBe(parsed.code);
      expect(response.error).toBe(parsed.error);
    });
  });
});
