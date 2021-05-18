#!/usr/bin/env node

const sade = require('sade');
const { Tester } = require('./Tester');

sade('seo-lint <dir>', true)
  .version('1.0.0')
  .describe('Check a directory of HTML files for common SEO issues.')
  .example('public')
  .option('-H, --host', 'Set the expected host for internal links. (example.com)')
  .action(async (dir, opts) => {
    // Program handler
    const tester = new Tester({ siteWide: true, host: opts.host ? opts.host : '' });

    const results = await tester.folder(dir);

    if (Object.keys(results).length > 0) {
      console.log(results);
    } else {
      console.log(`No SEO issues detected.`);
    }
  })
  .parse(process.argv);
