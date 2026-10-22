import test from 'node:test';
import assert from 'node:assert/strict';
import { handleFirestoreError, OperationType, FirestoreErrorInfo } from '../firebase';

test('handleFirestoreError formats FirestoreErrorInfo properly', () => {
  try {
    handleFirestoreError(new Error('Missing or insufficient permissions.'), OperationType.WRITE, 'shops/shop_123/products/prod_abc');
    assert.fail('Should have thrown error');
  } catch (err: unknown) {
    assert(err instanceof Error);
    const parsed: FirestoreErrorInfo = JSON.parse(err.message);
    assert.equal(parsed.operationType, 'write');
    assert.equal(parsed.path, 'shops/shop_123/products/prod_abc');
    assert.ok(parsed.error.includes('permissions'));
    assert.ok(typeof parsed.authInfo === 'object');
  }
});
