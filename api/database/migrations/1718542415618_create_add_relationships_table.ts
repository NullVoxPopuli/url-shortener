import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.integer('account_id').notNullable()
      table.foreign('account_id').references('accounts.id')
    })
    this.schema.alterTable('accounts', (table) => {
      table.integer('admin_id').notNullable()
      table.foreign('admin_id').references('users.id')
    })
    this.schema.alterTable('links', (table) => {
      table.integer('owned_by').notNullable()
      table.integer('created_by').notNullable()
      table.foreign('owned_by').references('accounts.id')
      table.foreign('created_by').references('users.id')
      table.index(['owned_by'], 'owned_by_index')
    })
    this.schema.alterTable('custom_links', (table) => {
      table.string('link_id').notNullable()
      //table.foreign('link_id').references('links.id')
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropForeign('account_id')
      table.dropColumn('account_id')
    })
    this.schema.alterTable('accounts', (table) => {
      table.dropForeign('admin_id')
      table.dropColumn('admin_id')
    })
    this.schema.alterTable('links', (table) => {
      table.dropIndex('owned_by_index')
      table.dropForeign('owned_by')
      table.dropForeign('created_by')
      table.dropColumn('owned_by')
      table.dropColumn('created_by')
    })
    this.schema.alterTable('custom_links', (table) => {
      //table.foreign('link_id').references('links.id')
      table.dropColumn('link_id')
    })
  }
}

