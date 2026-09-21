import type { HttpContext } from '@adonisjs/core/http';
import { action } from '../base.js';
import { listPlans } from './actions/plans.js';

export default class PlansController {
  /**
   * List the paid plans with their prices and limits. No authentication.
   */
  async index(context: HttpContext) {
    return action(context, listPlans);
  }
}
