import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'links';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('expires_at');
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('expires_at');
    });
  }
}
