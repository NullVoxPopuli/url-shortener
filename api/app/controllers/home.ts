import type { HttpContext } from '@adonisjs/core/http'

export default class LinksController {
  async index({ request, view, ...rest }: HttpContext) {
    let host = request.host()
    let isLocal = host?.includes('localhost')

    return view.render('index', {
      isLocal,
    })
  }
}
