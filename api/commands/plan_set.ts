import { BaseCommand, args } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';

export default class PlanSet extends BaseCommand {
  static commandName = 'plan:set';
  static description = 'Set an account plan directly, bypassing Stripe (staff tooling)';

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  };

  @args.string({ description: 'Account id or name' })
  declare account: string;

  @args.string({ description: 'Plan key (side-hobby, hobby, project, free, none)' })
  declare plan: string;

  async run() {
    const { default: Account } = await import('#models/account');
    const { overridePlan } = await import('#services/plan_override');
    const { planFor } = await import('#services/plans');

    let account = await Account.find(this.account);

    account ??= await Account.findBy({ name: this.account });

    if (!account) {
      this.logger.error(`No account found by id or name: ${this.account}`);
      this.exitCode = 1;

      return;
    }

    await overridePlan(account, this.plan);

    this.logger.success(
      `${account.name} (${account.id}) is now on the "${planFor(account).name}" plan`
    );
  }
}
