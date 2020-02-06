import fs from 'fs';
import Handlebars from 'handlebars';
import { defaultsDeep } from 'lodash';
import path from 'path';
import readPkgUp from 'read-pkg-up';
import { Context, Middleware } from 'koa';

export interface SwaggerOptions {
  [key: string]: string | boolean | string[] | object;
  dom_id: string;
  url: string;
  supportedSubmitMethods: string[];
  docExpansion: string;
  jsonEditor: boolean;
  defaultModelRendering: string;
  showRequestHeaders: boolean;
  layout: string;
  spec: object;
}

export interface KoaSwaggerUiOptions {
  title: string;
  oauthOptions: boolean | any;
  swaggerOptions: Partial<SwaggerOptions>;
  swaggerVersion: string;
  routePrefix: string | false;
  hideTopbar: boolean;
  favicon16: string;
  favicon32: string;
}

const defaultOptions: KoaSwaggerUiOptions = {
  title: 'Swagger UI',
  oauthOptions: false,
  swaggerOptions: {
    dom_id: '#swagger-ui',
    url: 'https://petstore.swagger.io/v2/swagger.json',
    layout: 'StandaloneLayout',
  },
  routePrefix: '/docs',
  swaggerVersion: '',
  hideTopbar: false,
  favicon16: '/favicon-16x16.png',
  favicon32: '/favicon-32x32.png',
};

function koaSwagger(config: Partial<KoaSwaggerUiOptions> = {}): Middleware {
  if (config.swaggerVersion === undefined) {
    const pkg = readPkgUp.sync({ cwd: __dirname });
    if (pkg === undefined) {
      throw new Error('Package not found');
    }

    defaultOptions.swaggerVersion = pkg.packageJson.devDependencies!['swagger-ui-dist'];
  }

  // Setup icons
  const extFavicon16 = config.favicon16;
  const extFavicon32 = config.favicon32;
  const favicon16Path = path.join(__dirname, defaultOptions.favicon16);
  const favicon32Path = path.join(__dirname, defaultOptions.favicon32);

  // Setup default options
  const options = defaultsDeep(config, defaultOptions);
  Handlebars.registerHelper('json', context => JSON.stringify(context));
  Handlebars.registerHelper('strfnc', fnc => fnc);
  Handlebars.registerHelper('isset', function (this: any, conditional: any, opt) {
    return conditional ? opt.fn(this) : opt.inverse(this);
  });
  const index = Handlebars.compile(fs.readFileSync(path.join(__dirname, './index.hbs'), 'utf-8'));

  // eslint-disable-next-line func-names
  return function koaSwaggerUi(ctx: Context, next: any) {
    if (options.routePrefix === false || ctx.path === options.routePrefix) {
      ctx.type = 'text/html';
      ctx.body = index(options);
      return true;
    }

    if (extFavicon16 === undefined && ctx.path === defaultOptions.favicon16) {
      ctx.type = 'image/png';
      ctx.body = fs.createReadStream(favicon16Path);
      return true;
    }

    if (extFavicon32 === undefined && ctx.path === defaultOptions.favicon32) {
      ctx.type = 'image/png';
      ctx.body = fs.createReadStream(favicon32Path);
      return true;
    }

    return next();
  };
}

export default koaSwagger;
module.exports = koaSwagger;
