import cheerio from 'cheerio';

import { totalist } from 'totalist/sync';
import fs from 'fs';
import path from 'path';
import { rules as pkgRules } from './rules';

export const defaultPreferences = {
  internalLinksLowerCase: true,
  internalLinksTrailingSlash: true,
};

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

type TMessage = {
  message: string;
  priority: number;
};

const emptyRule = {
  name: '',
  description: '',
  success: false as boolean,
  errors: [] as TMessage[],
  warnings: [] as TMessage[],
  info: [] as TMessage[],
};

type TRule = typeof emptyRule;

type TPair = [string, string];

type TSiteResults = {
  [key: string]: any[];
};

type TLinkers = {
  [key: string]: string[];
};

export const Tester = function ({
  rules = [],
  display = ['errors', 'warnings'],
  siteWide = false,
  host = '',
  preferences = {},
}) {
  preferences = { ...defaultPreferences, ...preferences };
  this.currentRule = JSON.parse(JSON.stringify(emptyRule));
  this.currentUrl = '';

  const rulesToUse = rules.length > 0 ? rules : pkgRules;
  const internalLinks: Array<TPair> = []; //[[link, linkedFrom]]
  const pagesSeen: Set<string> = new Set();
  const siteWideLinks = new Map();

  const titleTags = new Map();
  const metaDescriptions = new Map();

  let results: TRule[] = [];
  const siteResults: TSiteResults = {
    duplicateTitles: [],
    duplicateMetaDescriptions: [],
    orphanPages: [],
    brokenInternalLinks: [],
  };

  const logMetaDescription = (meta) => {
    if (metaDescriptions.has(meta)) {
      siteResults.duplicateMetaDescriptions.push([metaDescriptions.get(meta), this.currentUrl]);
    } else {
      metaDescriptions.set(meta, this.currentUrl);
    }
  };

  const logTitleTag = (title) => {
    if (titleTags.has(title)) {
      siteResults.duplicateTitles.push([titleTags.get(title), this.currentUrl]);
    } else {
      titleTags.set(title, this.currentUrl);
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
    results.push(this.currentRule);
    this.currentRule = JSON.parse(JSON.stringify(emptyRule));
  };

  const reset = () => {
    results = [];
  };

  const test = async (html: string, url: string) => {
    try {
      this.currentUrl = url;
      pagesSeen.add(url);

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
        siteWideLinks.set(url, result.aTags);
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
          .forEach((a) => internalLinks.push([a, this.currentUrl]));
      }

      for (let i = 0; i < rulesToUse.length; i++) {
        const rule = rulesToUse[i];
        startRule(rule);
        await rule.validator(
          { result, response: { url, host }, preferences },
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
            ...results
              .filter((r) => !r.success)
              .reduce((o, ruleResult) => {
                return [
                  ...o,
                  ...ruleResult[key]
                    .sort((a: TMessage, b: TMessage) => a.priority - b.priority)
                    .map((r) => ({ ...r, level: key })),
                ];
              }, [] as TMessage[]),
          ];
        }, [] as TMessage[]);

      if (siteWide) {
        siteResults[url] = out;
      } else {
        return out;
      }

      results = [];
    } catch (e) {
      console.error(e);
    }
  };

  return {
    test,
    reset,
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

      for (const page of pagesSeen.values()) {
        if (!internalLinks.find((il) => il[0] === page)) siteResults.orphanPages.push(page);
      }

      for (const [link, linker] of internalLinks) {
        if (!pagesSeen.has(link)) siteResults.brokenInternalLinks.push({ link, linker });
      }

      const whatLinksWhere: TLinkers = {};
      for (const [linker, links] of siteWideLinks.entries()) {
        for (let i = 0; i < links.length; i++) {
          const link = links[i];
          if (!whatLinksWhere[link.href]) whatLinksWhere[link.href] = [];
          whatLinksWhere[link.href].push(linker);
        }
      }

      const outResults = Object.keys(siteResults).reduce(
        (out, key) => {
          if (Array.isArray(siteResults[key]) && siteResults[key].length > 0) {
            out[key] = siteResults[key];
          }
          return out;
        },
        { meta: { whatLinksWhere } },
      );

      return outResults;
    },
  };
};
