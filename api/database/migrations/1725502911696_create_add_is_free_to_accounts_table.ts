import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'accounts';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_free');
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_free');
    });
  }
}
