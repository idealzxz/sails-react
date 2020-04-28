/**
 * app.js
 *
 * Use `app.js` to run your app without `sails lift`.
 * To start the server, run: `node app.js`.
 *
 * This is handy in situations where the sails CLI is not relevant or useful,
 * such as when you deploy to a server, or a PaaS like Heroku.
 *
 * For example:
 *   => `node app.js`
 *   => `npm start`
 *   => `forever start app.js`
 *   => `node debug app.js`
 *
 * The same command-line arguments and env vars are supported, e.g.:
 * `NODE_ENV=production node app.js --port=80 --verbose`
 *
 * For more information see:
 *   https://sailsjs.com/anatomy/app.js
 */

// Ensure we're in the project directory, so cwd-relative paths work as expected
// no matter where we actually lift from.
// > Note: This is not required in order to lift, but it is a convenient default.
process.chdir(__dirname);
// var ProgressPlugin = require('webpack/lib/ProgressPlugin');
// Attempt to import `sails` dependency, as well as `rc` (for loading `.sailsrc` files).
var sails;
var rc;
try {
    sails = require('sails');
    rc = require('sails/accessible/rc');
} catch (err) {
    console.error("Encountered an error when attempting to require('sails'):");
    console.error(err.stack);
    console.error('--');
    console.error('To run an app using `node app.js`, you need to have Sails installed');
    console.error("locally (`./node_modules/sails`).  To do that, just make sure you're");
    console.error('in the same directory as your app and run `npm install`.');
    console.error();
    console.error('If Sails is installed globally (i.e. `npm install -g sails`) you can');
    console.error('also run this app with `sails lift`.  Running with `sails lift` will');
    console.error('not run this file (`app.js`), but it will do exactly the same thing.');
    console.error("(It even uses your app directory's local Sails install, if possible.)");
    return;
} //-•

// Start server
sails.lift(rc('sails'), function (err) {
    if (err) return sails.log.error(err);
    WebpackStart(process.env.NODE_ENV);
});

function WebpackStart(env) {
    let webpack = require('webpack');
    let webpackCfg = require('./webpack.config.js');
    // 设置打包环境
    webpackCfg.mode = env === 'production' ? 'production' : 'development';
    // https://www.webpackjs.com/api/node/#compiler-%E5%AE%9E%E4%BE%8B-compiler-instance-
    let webpackCompiler = webpack(webpackCfg, function (err, stats) {
        if (err) throw err;
        sails.log.info('webpack: compiler loaded.');
        if (sails.config.environment !== 'production') {
            sails.log.info('webpack: watching...');
            webpackCompiler.watch({ aggregateTimeout: 300, poll: true }, afterBuild);
        } else {
            sails.log.info('webpack: running...');
            webpackCompiler.run(afterBuild);
        }
    });
    webpackCompiler.apply(
        new webpack.ProgressPlugin(function (percentage, msg) {
            var lineBreak = percentage == 1 ? '\n' : '';
            process.stdout.write(
                '\r webpack progress: ' + (percentage * 100).toFixed(0) + '%' + lineBreak,
            );
        }),
    );
}
function afterBuild(err, stats) {
    if (err) {
        sails.log.error('webpack watch fail');
    } else {
        let jsonStats = stats.toJson();
        if (jsonStats.errors.length > 0) {
            sails.log.error('wabpack compiled error:\n');
            return dealWebpackErrors(jsonStats.errors, 'error');
        }
        if (jsonStats.warnings.length > 0) {
            sails.log.warn('wabpack compiled warn:\n');
            return dealWebpackErrors(jsonStats.warnings, 'warn');
        }
        sails.log.info('webpack watch files changed and compiled success');
    }
}
function dealWebpackErrors(errors, type) {
    errors.forEach(function (v, k) {
        sails.log[type](v);
    });
}
