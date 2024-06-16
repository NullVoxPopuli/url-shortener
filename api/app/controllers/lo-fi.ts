import Link from '#models/link'
import { compressedUUID } from '#utils/uuid'
import type { HttpContext } from '@adonisjs/core/http'
export default class LoFiLinks {
  async create({ view }: HttpContext) {
    return view.render('lo-fi/create')
  }

  async createLink({ request, response, view }: HttpContext) {
    let data = request.body()
    let originalUrl = data.originalUrl

    if (!URL.canParse(originalUrl)) {
      response.status(422)
      response.send('Cannot parse URL, check the URL')
      return
    }

    let link = await Link.create({
      original: originalUrl,
    })
    let shorter = compressedUUID.encode(link.id)

    response.status(201)

    view.render('lofi/success', { shortUrl: `${request.host}/${shorter}` })
  }
}
