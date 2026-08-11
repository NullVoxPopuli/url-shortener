import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'accounts';

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      /**
       * Every user gets exactly one personal account at signup; other
       * accounts ("additional accounts") are created explicitly and
       * are gated by the creator's plan.
       */
      table.boolean('is_personal').notNullable().defaultTo(true);
    });
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_personal');
    });
  }
}
