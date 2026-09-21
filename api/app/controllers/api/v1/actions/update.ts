import { DateTime } from 'luxon';
import type { HttpContext } from '@adonisjs/core/http';
import Link from '#models/link';
import LinkEdit from '#models/link_edit';
import { notFound, paymentRequired, unprocessable } from '#exceptions/api_errors';
import { editQuotaForAccount } from '#services/link_quota';
import { authenticateWithScope } from '#services/api_keys';
import { isUUID } from '#utils/uuid';

/**
 * PATCH /v1/links/:id
 *
 * Changes the destination and / or the expiration of a link. Both are
 * plan features: every change counts against the plan's monthly edit
 * quota, and setting an expiration needs a plan that includes it.
 */
export async function updateLink(context: HttpContext) {
  let { request } = context;
  let id = request.param('id');

  let { user, account } = await authenticateWithScope(context, 'links:write');

  if (!isUUID(id)) {
    throw unprocessable('ID received is not a valid UUID');
  }

  // Scoped to the caller's account, so someone else's link 404s like a missing id.
  let link = await Link.query().where('owned_by', account.id).where('id', id).first();

  if (!link) {
    throw notFound('Link', id);
  }

  let input = await context.jsonApi.deserialize(Link, { expectedId: id });
  let changes = parseChanges(input.attributes);

  if (!changes.original && !changes.expiresAt) {
    // Nothing to change: no edit is spent.
    return renderFresh(context, link);
  }

  let quota = await editQuotaForAccount(account);

  if (quota.remaining === 0) {
    throw paymentRequired(
      'Payment required',
      quota.limit === 0
        ? 'Editing links is not included in your plan'
        : 'Monthly link edit limit reached'
    );
  }

  if (changes.expiresAt && !quota.plan.linkExpiration) {
    throw paymentRequired('Payment required', 'Link expiration is not included in your plan');
  }

  let edit = new LinkEdit();
  edit.link_id = link.id;
  edit.account_id = account.id;
  edit.edited_by = user.id;
  edit.previousOriginal = link.original;
  edit.previousExpiresAt = link.expiresAt ?? null;

  if (changes.original) {
    link.original = changes.original.value;
  }

  if (changes.expiresAt) {
    link.expiresAt = changes.expiresAt.value as DateTime;
  }

  if (!link.$isDirty) {
    // Same values as before: no edit is spent.
    return renderFresh(context, link);
  }

  await link.save();
  await edit.save();

  return renderFresh(context, link);
}

/**
 * Wrapped in `{ value }` so a requested `expiresAt: null` (clear the
 * expiration) is distinct from "not sent".
 */
function parseChanges(attributes: Record<string, unknown>) {
  let original: { value: string } | null = null;
  let expiresAt: { value: DateTime | null } | null = null;

  if ('original' in attributes) {
    let raw = String(attributes.original ?? '');

    if (!URL.canParse(raw)) {
      throw unprocessable('Cannot parse URL, check the URL');
    }

    original = { value: new URL(raw).toString() };
  }

  if ('expiresAt' in attributes) {
    let raw = attributes.expiresAt;

    if (raw === null || raw === '') {
      expiresAt = { value: null };
    } else {
      let parsed = DateTime.fromISO(String(raw), { zone: 'utc' });

      if (!parsed.isValid) {
        throw unprocessable('expiresAt must be an ISO 8601 date');
      }

      if (parsed <= DateTime.utc()) {
        throw unprocessable('expiresAt must be in the future');
      }

      expiresAt = { value: parsed };
    }
  }

  return { original, expiresAt };
}

async function renderFresh(context: HttpContext, link: Link) {
  let fresh = await context.jsonApi.query(Link).where('id', link.id).first();

  return context.jsonApi.render(fresh ?? link);
}
