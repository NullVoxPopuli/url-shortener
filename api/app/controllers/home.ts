import type { HttpContext } from '@adonisjs/core/http';

export default class HomeController {
  async index({ request, view }: HttpContext) {
    return view.render('index');
  }
}
