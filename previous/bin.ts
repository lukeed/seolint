#!/usr/bin/env node

import sade from 'sade';
import path from 'path';
import fs from 'fs';

import { Tester } from './Tester';

sade('seo-lint <dir>', true)
  .version('1.0.0')
  .describe('Check a directory of HTML files for common SEO issues.')
  .example('public -H example.com -c seo-lint.config.js -w report.json')
  .option('-H, --host', 'Set the expected host for internal links. (example.com)')
  .option('-c, --config', 'Set a custom config to specify rules.')
  .option('-w, --write', 'Location to write a report to a JSON file.')
  .action(async (dir, opts) => {
    try {
      let config, writeLocation;
      if (opts.config) {
        const configLocation = path.resolve(opts.config);
        if (fs.existsSync(configLocation)) {
          config = require(configLocation);
        } else {
          throw Error(`No config found at ${configLocation}`);
        }
      }

      console.log('latest');

      if (opts.write) {
        writeLocation = path.resolve(opts.write);
      } else if (config && config.writeLocation) {
        writeLocation = path.resolve(config.writeLocation);
      }

      if (writeLocation) {
        const parsedWL = path.parse(writeLocation);
        if (parsedWL.ext !== '.json') {
          throw new Error('--write or writeLocation in config must write to a .json file.');
        }
        if (!fs.existsSync(parsedWL.dir)) {
          fs.mkdirSync(parsedWL.dir, { recursive: true });
        }
      }

      // Program handler
      const tester = Tester({ siteWide: true, host: opts.host ? opts.host : '', ...config });

      const { meta, ...results } = await tester.folder(dir);

      if (Object.keys(results).length > 0) {
        console.log(results);
        if (writeLocation) {
          fs.writeFileSync(writeLocation, JSON.stringify({ success: false, meta, results }, null, 2), {
            encoding: 'utf-8',
          });
        }
      } else {
        console.log(`No SEO issues detected.`);
        if (writeLocation) {
          fs.writeFileSync(writeLocation, JSON.stringify({ success: true, meta, results }, null, 2), {
            encoding: 'utf-8',
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  })
  .parse(process.argv);
