import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

/**
 * Guest middleware is used to deny access to routes that should
 * be accessed by unauthenticated users.
 *
 * For example, the login page should not be accessible if the user
 * is already logged-in
 */
export default class LoggerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await next();

    console.debug(
      `[${ctx.request.method()}] ${ctx.request.url()}` + `  => ${ctx.response.getStatus()}`
    );
    if (ctx.response.getStatus() > 400) {
      let body = ctx.response.getBody();

      if ('frames' in body) {
        let cwd = process.cwd();
        let frames = body.frames;
        let stack = frames.map((x: any) => {
          let filePath = x.filePath;
          if (filePath.includes('.pnpm')) {
            let [, path] = filePath.split('/.pnpm/');
            return '[.pnpm]/' + path;
          }
          return filePath.replace(cwd, './');
        });
        console.error(stack);
      }
    }
  }
}
