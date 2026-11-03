import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'links';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // null = the default short domain
      table.string('domain').nullable();
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('domain');
    });
  }
}
