import cheerio from 'cheerio';

import { totalist } from 'totalist/sync';
import fs from 'fs';
import path from 'path';
import { rules as pkgRules } from './rules';

const getHtmlFiles = (p): string[] => {
  const html = new Set();
  totalist(p, (name: string, abs: string, stats) => {
    if (/\.html$/.test(name) && !name.includes('node_modules')) {
      html.add(abs);
    }
  });
  return [...html] as string[];
};

const $attributes = ($, search) => {
  const arr = [];
  $(search).each(function () {
    const namespace = $(this)[0].namespace;
    if (!namespace || namespace.includes('html')) {
      const out = {
        tag: $(this)[0].name,
        innerHTML: $(this).html(),
        innerText: $(this).text(),
      };

      if ($(this)[0].attribs) {
        Object.entries($(this)[0].attribs).forEach((attr) => {
          out[attr[0].toLowerCase()] = attr[1];
        });
      }

      arr.push(out);
    }
  });
  return arr;
};

const emptyRule = {
  name: '',
  description: '',
  success: false,
  errors: [],
  warnings: [],
  info: [],
};

export const Tester = function ({ rules = [], display = ['errors', 'warnings'], siteWide = false, host = '' }) {
  this.rules = [...pkgRules, ...rules];
  this.internalLinks = []; //[[link, linkedFrom]]
  this.pagesSeen = new Set();

  this.currentUrl = '';

  this.titleTags = new Map();
  this.metaDescriptions = new Map();

  this.currentRule = JSON.parse(JSON.stringify(emptyRule));

  this.results = [];
  this.siteResults = {
    duplicateTitles: [],
    duplicateMetaDescriptions: [],
  };

  const logMetaDescription = (meta) => {
    if (this.metaDescriptions.has(meta)) {
      this.siteResults.duplicateMetaDescriptions.push([this.metaDescriptions.get(meta), this.currentUrl]);
    } else {
      this.metaDescriptions.set(meta, this.currentUrl);
    }
  };

  const logTitleTag = (title) => {
    if (this.titleTags.has(title)) {
      this.siteResults.duplicateTitles.push([this.titleTags.get(title), this.currentUrl]);
    } else {
      this.titleTags.set(title, this.currentUrl);
    }
  };

  const noEmptyRule = () => {
    if (!this.currentRule.name || this.currentRule.name.length === 0) throw Error('No current test name');
    if (!this.currentRule.description || this.currentRule.description.length === 0)
      throw Error('No current test description');
  };

  const runTest = (defaultPriority = 50, arrName) => {
    return (t, ...params) => {
      let test = t;
      let priority = defaultPriority;

      // allows overwriting of priority
      if (typeof test !== 'function') {
        priority = t;
        test = params.splice(0, 1)[0];
      }

      noEmptyRule();
      this.count += 1;
      try {
        return test(...params);
      } catch (e) {
        this.currentRule[arrName].push({ message: e.message, priority });
        return e;
      }
    };
  };

  const startRule = ({ validator, test, testData, ...payload }) => {
    if (this.currentRule.errors.length > 0)
      throw Error(
        "Starting a new rule when there are errors that haven't been added to results. Did you run 'finishRule'? ",
      );
    if (this.currentRule.warnings.length > 0)
      throw Error(
        "Starting a new rule when there are warnings that haven't been added to results. Did you run 'finishRule'? ",
      );
    this.currentRule = Object.assign(this.currentRule, payload);
  };
  const finishRule = () => {
    if (this.currentRule.errors.length === 0 && this.currentRule.warnings.length === 0) this.currentRule.success = true;
    this.results.push(this.currentRule);
    this.currentRule = JSON.parse(JSON.stringify(emptyRule));
  };

  const test = async (html, url) => {
    try {
      this.currentUrl = url;
      this.pagesSeen.add(url);

      const $ = cheerio.load(html);

      const result = {
        html: $attributes($, 'html'),
        title: $attributes($, 'title'),
        meta: $attributes($, 'head meta'),
        ldjson: $attributes($, 'script[type="application/ld+json"]'),
        h1s: $attributes($, 'h1'),
        h2s: $attributes($, 'h2'),
        h3s: $attributes($, 'h3'),
        h4s: $attributes($, 'h4'),
        h5s: $attributes($, 'h5'),
        h6s: $attributes($, 'h6'),
        canonical: $attributes($, '[rel="canonical"]'),
        imgs: $attributes($, 'img'),
        aTags: $attributes($, 'a'),
        linkTags: $attributes($, 'link'),
        ps: $attributes($, 'p'),
      };

      if (siteWide) {
        if (result.title[0] && result.title[0].innerText) {
          logTitleTag(result.title[0].innerText);
        }
        const metaDescription = result.meta.find((m) => m.name && m.name.toLowerCase() === 'description');
        if (metaDescription) {
          logMetaDescription(metaDescription.content);
        }
        result.aTags
          .filter((a) => !!a.href)
          .filter((a) => !a.href.includes('http'))
          .filter((a) => {
            if (this.currentUrl !== '/') {
              return !a.href.endsWith(this.currentUrl);
            }
            return true;
          })
          .filter((a) => a.href !== this.currentUrl)
          .map((a) => a.href)
          .forEach((a) => this.internalLinks.push([a, this.currentUrl]));
      }

      for (let i = 0; i < this.rules.length; i++) {
        const rule = this.rules[i];
        startRule(rule);
        await rule.validator(
          { result, response: { url, host } },
          {
            test: runTest(70, 'errors'),
            lint: runTest(40, 'warnings'),
          },
        );
        finishRule();
      }

      const validDisplay = ['warnings', 'errors'];
      const out = display
        .filter((d) => validDisplay.includes(d))
        .reduce((out, key) => {
          return [
            ...out,
            ...this.results
              .filter((r) => !r.success)
              .sort((a, b) => a.priority > b.priority)
              .reduce((o, ruleResult) => {
                return [...o, ...ruleResult[key].map((r) => ({ ...r, level: key }))];
              }, []),
          ];
        }, []);

      if (siteWide) {
        this.siteResults[url] = out;
      } else {
        return out;
      }

      this.results = [];
    } catch (e) {
      console.error(e);
    }
  };

  return {
    test,
    folder: async (folder) => {
      const parsedFolder = path.parse(path.resolve(folder));
      const normalizedFolder = `${parsedFolder.dir}/${parsedFolder.base}`;

      const files = getHtmlFiles(`${normalizedFolder}`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const html = fs.readFileSync(path.resolve(file), { encoding: 'utf-8' });

        const relPermalink = file.replace('index.html', '').replace(normalizedFolder, '');
        // eslint-disable-next-line jest/expect-expect
        await test(html, relPermalink);
      }

      this.siteResults.orphanPages = [];
      for (const page of this.pagesSeen.values()) {
        if (!this.internalLinks.find((il) => il[0] === page)) this.siteResults.orphanPages.push(page);
      }

      this.siteResults.brokenInternalLinks = [];
      for (const [link, linker] of this.internalLinks) {
        if (!this.pagesSeen.has(link)) this.siteResults.brokenInternalLinks.push({ link, linker });
      }

      const results = Object.keys(this.siteResults).reduce((out, key) => {
        if (Array.isArray(this.siteResults[key]) && this.siteResults[key].length > 0) {
          out[key] = this.siteResults[key];
        }
        return out;
      }, {});

      return results;
    },
  };
};
