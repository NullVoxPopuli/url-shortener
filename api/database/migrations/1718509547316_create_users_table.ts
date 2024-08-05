import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'users';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary();
      table.string('name').nullable();

      // Foreign Keys
      table.uuid('account_id');

      // Oauth - ids / names
      table.string('oauth_github_id');
      table.string('oauth_twitter_id');
      table.string('oauth_google_id');
      // Oauth - auth
      table.string('oauth_github_token');
      table.string('oauth_twitter_token');
      table.string('oauth_google_token');

      // Time!
      table.timestamp('created_at').notNullable();
      table.timestamp('updated_at').nullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
