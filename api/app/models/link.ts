import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Account from './account.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class Link extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare original: string

  @column()
  declare visits: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Account, { localKey: 'owned_by' })
  declare ownedBy: BelongsTo<typeof Account>

  @belongsTo(() => User, { localKey: 'created_by' })
  declare createdBy: BelongsTo<typeof User>
}

