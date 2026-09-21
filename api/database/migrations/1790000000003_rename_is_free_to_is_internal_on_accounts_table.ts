import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'accounts';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('is_free', 'is_internal');
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('is_internal', 'is_free');
    });
  }
}
