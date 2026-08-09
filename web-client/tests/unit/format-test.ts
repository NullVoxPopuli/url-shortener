import { module, test } from 'qunit';

import { formatDate, formatUtcDateTime } from '#app/routes/dashboard/format';

module('Unit | dashboard | format', function () {
  test('formatDate renders a short date', function (assert) {
    assert.strictEqual(formatDate('2026-08-09T12:00:00.000Z'), 'Aug 9, 2026');
  });

  test('formatDate handles empty and invalid values', function (assert) {
    assert.strictEqual(formatDate(null), '—');
    assert.strictEqual(formatDate(undefined), '—');
    assert.strictEqual(formatDate(''), '—');
    assert.strictEqual(formatDate('not-a-date'), '—');
  });

  test('formatUtcDateTime pins to UTC with the zone label', function (assert) {
    assert.strictEqual(
      formatUtcDateTime('2026-08-31T23:59:59.999Z'),
      'Aug 31, 2026, 11:59 PM UTC'
    );
  });

  test('formatUtcDateTime handles empty and invalid values', function (assert) {
    assert.strictEqual(formatUtcDateTime(null), '—');
    assert.strictEqual(formatUtcDateTime('nope'), '—');
  });
});
