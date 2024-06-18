import User from '#models/user';
import db from '@adonisjs/lucid/services/db';
import Account from '#models/account';
import Link from '#models/link';
import { compressedUUID } from '@nullvoxpopuli/url-compression';
import type { HttpContext } from '@adonisjs/core/http';

export default class LoFiLinks {
  async index({ view, auth }: HttpContext) {
    await auth.check();

    return view.render('lo-fi/index');
  }

  async create({ view }: HttpContext) {
    return view.render('lo-fi/create');
  }

  async createLink({ request, response, view }: HttpContext) {
    let data = request.body();
    let originalUrl = data.originalUrl;

    if (!URL.canParse(originalUrl)) {
      response.status(422);
      response.send('Cannot parse URL, check the URL');
      return;
    }

    let user!: User;
    let account!: Account;
    await db.transaction(async (trx) => {
      user = new User();
      account = new Account();

      user.name = 'NVP';
      account.name = 'Test';

      user.useTransaction(trx);
      account.useTransaction(trx);

      await user.related('account').associate(account);
      await account.related('admin').associate(user);

      user.save();
      account.save();
    });

    let link = new Link();
    link.original = originalUrl;
    link.owned_by = account.id;
    link.created_by = user.id;
    await link.save();

    let shorter = compressedUUID.encode(link.id);
    let shortUrl = `${request.host()}/${shorter}`;

    response.status(201);

    return view.render('lo-fi/success', { shortUrl });
  }
}
