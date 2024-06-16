import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'links'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table.text('original').notNullable()
      table.integer('visits').defaultTo(0)
      // account
      table.foreign('owned_by').references('accounts.id').notNullable().index('owned_by_index')
      // user
      table.foreign('created_by').references('users.id').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

