import { test } from '@japa/runner';
import { assert } from 'chai';
import { DOMAIN } from '#start/env';
import { isSafeRedirect } from '#controllers/api/v1/billing';

test.group('isSafeRedirect', () => {
  test('allows relative paths', () => {
    assert.isTrue(isSafeRedirect('/'));
    assert.isTrue(isSafeRedirect('/billing'));
    assert.isTrue(isSafeRedirect('/settings/billing?tab=invoices'));
  });

  test('rejects scheme-relative URLs disguised as paths', () => {
    assert.isFalse(isSafeRedirect('//evil.com'));
    assert.isFalse(isSafeRedirect('//evil.com/billing'));
    assert.isFalse(isSafeRedirect('/\\evil.com'));
  });

  test('allows our own domain and subdomains', () => {
    assert.isTrue(isSafeRedirect(`https://${DOMAIN}/billing`));
    assert.isTrue(isSafeRedirect(`https://app.${DOMAIN}/billing`));
    assert.isTrue(isSafeRedirect(`https://app.${DOMAIN}:5002/billing`));
  });

  test('rejects other domains', () => {
    assert.isFalse(isSafeRedirect('https://evil.com'));
    assert.isFalse(isSafeRedirect(`https://${DOMAIN}.evil.com`));
    assert.isFalse(isSafeRedirect(`https://evil${DOMAIN}`));
  });

  test('rejects non-URL garbage', () => {
    assert.isFalse(isSafeRedirect(''));
    assert.isFalse(isSafeRedirect('javascript:alert(1)'));
    assert.isFalse(isSafeRedirect('not a url'));
  });
});
