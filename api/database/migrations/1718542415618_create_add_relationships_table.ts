import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.foreign('account_id').references('accounts.id');
    });
    this.schema.alterTable('accounts', (table) => {
      table.foreign('admin_id').references('users.id');
    });
    this.schema.alterTable('links', (table) => {
      table.foreign('owned_by').references('accounts.id');
      table.foreign('created_by').references('users.id');
      table.index('owned_by', 'owned_by_index');
    });
    this.schema.alterTable('custom_links', (table) => {
      table.foreign('link_id').references('links.id');
    });
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropForeign('account_id');
    });
    this.schema.alterTable('accounts', (table) => {
      table.dropForeign('admin_id');
    });
    this.schema.alterTable('links', (table) => {
      table.dropIndex('owned_by', 'owned_by_index');
      table.dropForeign('owned_by');
      table.dropForeign('created_by');
    });
    this.schema.alterTable('custom_links', (table) => {
      table.foreign('link_id').references('links.id');
    });
  }
}
