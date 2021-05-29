import assert from 'assert';
import { defaultPreferences } from './Tester';

const cleanString = (str) =>
  str
    .toLowerCase()
    .replace('|', '')
    .replace('-', '')
    .replace('.', '')
    .replace(':', '')
    .replace('!', '')
    .replace('?', '');

export const rules = [
  {
    name: 'Canonical Tag',
    description: `Validates that the canonical tag is well formed, that there isn't multiple, and that it matches the url crawled.`,
    testData: {
      preferences: defaultPreferences,
      response: {
        url: 'https://nicholasreese.com/',
      },
      result: {
        canonical: [{ rel: 'canonical', href: 'https://nicholasreese.com/', innerText: '', innerHTML: '' }],
      },
    },
    validator: async (payload, tester) => {
      const canonicals = payload.result.canonical;
      tester.test(
        100,
        assert.strictEqual,
        canonicals.length,
        1,
        `There should be 1 and only 1 canonical tag, currently there are ${canonicals.length}`,
      );
      if (canonicals[0]) {
        const {url, host} = payload.response
        tester.test(
          100, 
          assert_1.default.ok, 
          canonicals[0].href.includes('http') && canonicals[0].href.includes(host) && canonicals[0].href.includes(url), 
          'Canonical should absolute url and match the url that was crawled. '
        );
      }
    },
  },
  {
    name: 'Title tag',
    description: `Validate that the title tag exists, isn't too long, and isn't too short.`,
    testData: {
      preferences: defaultPreferences,
      result: {
        title: [
          {
            innerText: 'Nick Reese - Actionable Business Advice for Entrepreneurs',
            innerHTML: 'Nick Reese - Actionable Business Advice for Entrepreneurs',
          },
        ],
      },
    },
    validator: async (payload, tester) => {
      const titles = payload.result.title;
      tester.test(
        100,
        assert.strictEqual,
        titles.length,
        1,
        `There should only one and only 1 title tag, currently there are ${titles.length}`,
      );

      if (titles.length !== 1) return;

      if (titles[0]) {
        tester.test(
          90,
          assert.strictEqual,
          titles[0].innerText,
          titles[0].innerHTML,
          'The title tag should not wrap other tags. (innerHTML and innerText should match)',
        );
        tester.test(100, assert.notStrictEqual, titles[0].innerText.length, 0, 'Title tags should not be empty');

        tester.test(100, assert.ok, !titles[0].innerText.includes('undefined'), `Title tag includes "undefined"`);
        tester.test(100, assert.ok, !titles[0].innerText.includes('null'), `Title tag includes "null"`);

        tester.lint(
          assert.ok,
          titles[0].innerText.length > 10,
          'This title tag is shorter than the recommended minimum limit of 10.',
        );
        tester.lint(
          assert.ok,
          titles[0].innerText.length < 70,
          'This title tag is longer than the recommended limit of 70.',
        );

        tester.test(
          assert.ok,
          titles[0].innerText.length < 200,
          `Something could be wrong this title tag is over 200 chars. : ${titles[0].innerText}`,
        );

        const stopWords = ['a', 'and', 'but', 'so', 'on', 'or', 'the', 'was', 'with'];

        stopWords.forEach((sw) => {
          tester.lint(
            assert.ok,
            titles[0].innerText.toLowerCase().indexOf(` ${sw} `),
            `Title tag includes stopword ${sw}`,
          );
        });
      }
    },
  },
  {
    name: 'Meta description',
    description: `Validate that a meta description exists, isn't too long, isn't too short, and uses at least a few keywords from the title.`,
    testData: {
      preferences: defaultPreferences,
      result: {
        meta: [
          {
            name: 'description',
            content: 'Nick Reese teaches you how effectively market your business both online and offline.',
          },
        ],
        title: [
          {
            innerText: 'Nick Reese - Actionable Business Advice for Entrepreneurs',
            innerHTML: 'Nick Reese - Actionable Business Advice for Entrepreneurs',
          },
        ],
      },
    },
    validator: async (payload, tester) => {
      const metas = payload.result.meta.filter((m) => m.name && m.name.toLowerCase() === 'description');

      tester.test(
        90,
        assert.ok,
        metas.length === 1,
        `There should be 1 and only 1 meta description. Currently there are ${metas.length}`,
      );

      if (metas[0]) {
        tester.test(90, assert.ok, metas[0] && metas[0].content, 'Meta description content="" should not be missing.');
        tester.test(90, assert.notStrictEqual, metas[0].content.length, 0, 'Meta description should not be empty');
        tester.test(100, assert.ok, !metas[0].content.includes('undefined'), `Meta description includes "undefined"`);
        tester.test(100, assert.ok, !metas[0].content.includes('null'), `Meta description includes "null"`);

        tester.lint(
          assert.ok,
          metas[0].content.length > 10,
          `This meta description is shorter than the recommended minimum limit of 10.`,
        );
        tester.lint(
          30,
          assert.ok,
          metas[0].content.length < 120,
          'This meta description is longer than the recommended limit of 120.',
        );

        tester.test(
          assert.ok,
          metas[0].content.length < 300,
          'Investigate this meta description. Something could be wrong as it is over 300 chars.',
        );

        if (payload.result.title[0]) {
          const titleArr = cleanString(payload.result.title[0].innerText)
            .split(' ')
            .filter((i) => [':', '|', '-'].indexOf(i) === -1);

          const compareArr = cleanString(metas[0].content)
            .split(' ')
            .filter((i) => [':', '|', '-'].indexOf(i) === -1);

          const matches = titleArr.filter((t) => compareArr.indexOf(t) !== -1);

          tester.lint(
            70,
            assert.ok,
            matches.length >= 1,
            'Meta description should include at least 1 of the words in the title tag.',
          );
        }
      }
    },
  },
  {
    name: 'HTags',
    description: `Validate that H tags are being used properly.`,
    testData: {
      preferences: defaultPreferences,
      result: {
        title: [
          {
            innerText: 'Nick Reese - Actionable Business Advice for Entrepreneurs',
            innerHTML: 'Nick Reese - Actionable Business Advice for Entrepreneurs',
          },
        ],
        h1s: [{ innerText: 'Entrepreneurs', innerHTML: 'Entrepreneurs' }],
        h2s: [{ innerText: 'Advice from Nick Reese', innerHTML: 'Advice from Nick Reese' }],
        h3s: [
          {
            innerText: "WHAT'S ON THIS WEBSITE For Entrepreneurs?",
            innerHTML: "What's On This Website For Entrepreneurs?",
          },
        ],
        h4s: [],
        h5s: [],
        h6s: [],
      },
    },
    validator: async (payload, tester) => {
      const { h1s, h2s, h3s, h4s, h5s, h6s, title, html } = payload.result;
      tester.test(
        90,
        assert.ok,
        h1s.length === 1,
        `There should be 1 and only 1 H1 tag on the page. Currently: ${h1s.length}`,
      );

      let titleArr;
      if (title[0]) {
        titleArr = cleanString(title[0].innerText)
          .split(' ')
          .filter((i) => [':', '|', '-'].indexOf(i) === -1);
      }

      if (h1s[0]) {
        tester.test(90, assert.notStrictEqual, h1s[0].innerText.length, 0, 'H1 tags should not be empty');
        tester.lint(
          assert.ok,
          h1s[0].innerText.length < 70,
          `H1 tag is longer than the recommended limit of 70. (${h1s[0].innerText})`,
        );
        tester.lint(
          assert.ok,
          h1s[0].innerText.length > 10,
          `H1 tag is shorter than the recommended limit of 10. (${h1s[0].innerText})`,
        );

        if (titleArr) {
          const compareArr = cleanString(h1s[0].innerText)
            .split(' ')
            .filter((i) => [':', '|', '-'].indexOf(i) === -1);

          const matches = titleArr.filter((t) => compareArr.indexOf(t) !== -1);

          if (matches.length < 1) console.log(titleArr, compareArr);

          tester.lint(70, assert.ok, matches.length >= 1, `H1 tag should have at least 1 word from your title tag.`);
        }
      } else {
        tester.test(assert.ok, h2s.length === 0, `No h1 tag, but h2 tags are defined.`);
        tester.test(assert.ok, h3s.length === 0, `No h1 tag, but h3 tags are defined.`);
      }

      let usesKeywords = false;
      if (html[0].innerText.length > 3000) {
        tester.lint(60, assert.ok, h2s.length >= 1, 'Page is missing an h2 tag.');
      }
      h2s.forEach((h2) => {
        tester.test(80, assert.notEqual, h2.innerText.length, 0, 'H2 tags should not be empty');
        tester.lint(
          assert.ok,
          h2.innerText.length < 100,
          `H2 tag is longer than the recommended limit of 100. (${h2.innerText})`,
        );
        tester.lint(
          assert.ok,
          h2.innerText.length > 10,
          `H2 tag is shorter than the recommended limit of 10. (${h2.innerText})`,
        );

        const compareArr = cleanString(h2.innerText)
          .split(' ')
          .filter((i) => [':', '|', '-'].indexOf(i) === -1);

        if (titleArr) {
          const matches = titleArr.filter((t) => compareArr.indexOf(t) !== -1);
          if (matches.length > 0) {
            usesKeywords = true;
          }
        }
      });

      if (h2s.length > 0 && title[0]) {
        tester.lint(70, assert.ok, usesKeywords, `None of your h2 tags use a single word from your title tag.`);
      }

      usesKeywords = false;
      h3s.forEach((h3) => {
        tester.test(70, assert.notStrictEqual, h3.innerText.length, 0, 'h3 tags should not be empty');
        tester.lint(
          20,
          assert.ok,
          h3.innerText.length < 100,
          `h3 tag is longer than the recommended limit of 100. (${h3.innerText})`,
        );
        tester.lint(
          20,
          assert.ok,
          h3.innerText.length > 7,
          `h3 tag is shorter than the recommended limit of 7. (${h3.innerText})`,
        );

        // const arr = h3.innerText
        //   .toLowerCase()
        //   .split(' ')
        //   .filter((i) => [':', '|', '-'].indexOf(i) === -1);

        // const matches = titleArr.filter((t) => arr.indexOf(t) !== -1);
        // if (matches.length > 0) {
        //   usesKeywords = true;
        // }
      });

      // if (h3s.length > 0) {
      //   tester.lint(
      //     40,
      //     assert.ok,
      //     usesKeywords,
      //     `None of your h3 tags use a single word from your title tag. Investigate.`,
      //   );
      // }

      h4s.forEach((h4) => {
        tester.test(50, assert.notEqual, h4.innerText.length, 0, 'h4 tags should not be empty');
        tester.lint(
          10,
          assert.ok,
          h4.innerText.length > 100,
          `h4 tag is longer than the recommended limit of 100. (${h4.innerText})`,
        );
        tester.lint(
          10,
          assert.ok,
          h4.innerText.length < 7,
          `h4 tag is shorter than the recommended limit of 7. (${h4.innerText})`,
        );
      });

      // check that we aren't overloading the htags or misusing their priority.
      tester.lint(
        80,
        assert.ok,
        !(h2s.length > 0 && h1s.length === 0),
        `There are h2 tags but no h1 tag. Consider If you can move one of your h2s to an h1.`,
      );
      tester.lint(
        50,
        assert.ok,
        !(h3s.length > 0 && h2s.length === 0),
        `There are h3 tags but no h2 tags. Consider If you can move h3s to h2s.`,
      );
      tester.lint(
        30,
        assert.ok,
        !(h4s.length > 0 && h3s.length === 0),
        `There are h4 tags but no h3 tags. Consider If you can move h4s to h3s.`,
      );
      tester.lint(
        30,
        assert.ok,
        !(h5s.length > 0 && h4s.length === 0),
        `There are h5 tags but no h4 tags. Consider If you can move h5s to h4s.`,
      );
      tester.lint(
        30,
        assert.ok,
        !(h6s.length > 0 && h5s.length === 0),
        `There are h6 tags but no h5 tags. Consider If you can move h6s to h5s.`,
      );
    },
  },
  {
    name: 'Viewport with Initial Scale 1.0',
    description:
      'Page has a <meta name="viewport" content="width=device-width, initial-scale=1.0" />. This will allow users to zoom on your mobile page but won\'t be zoomed in by default.',
    testData: {
      preferences: defaultPreferences,
      response: {
        meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }],
      },
    },
    validator: async (payload, tester) => {
      const viewport = payload.result.meta.find((m) => m.name === 'viewport');
      if (viewport) {
        tester.test(assert.ok, !!viewport, `Meta viewport should be defined`);
        tester.test(assert.ok, !!viewport.content, `Meta viewport has a content attribute`);
        tester.test(
          assert.ok,
          viewport.content.includes('width=device-width'),
          `Meta viewport content includes width=device-width`,
        );
        tester.lint(
          assert.ok,
          viewport.content.includes('initial-scale=1'),
          `Meta viewport content may want to include initial-scale=1`,
        );
      }
    },
  },
  {
    name: 'Internal Links are well formed',
    description: 'Checks that all internal links are lowercase and have a trailing slash',
    testData: {
      preferences: defaultPreferences,
      response: {
        ok: true,
        url: 'https://nicholasreese.com/',
      },

      result: {
        aTags: [
          {
            tag: 'a',
            innerHTML: '← Home',
            innerText: '← Home',
            href: '/',
            class: 'svelte-bvr7j8',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
        ],
      },
    },
    validator: async (payload, tester) => {
      const internal = payload.result.aTags.filter(
        (l) => (payload.response.host && l.href.includes(payload.response.host)) || !l.href.includes('http'),
      );
      if (payload.preferences.internalLinksLowerCase) {
        internal.forEach((l) => {
          tester.lint(
            80,
            assert.ok,
            l.href === l.href.toLowerCase(),
            `Internal links should be lowercase: [${l.innerText}](${l.href}) is not.`,
          );
        });
      }

      if (payload.preferences.internalLinksTrailingSlash) {
        internal.forEach((l) => {
          tester.lint(
            80,
            assert.ok,
            l.href.endsWith('/'),
            `Internal links should include a trailing slash: [${l.innerText}](${l.href}) does not.`,
          );
        });
      }

      internal.forEach((l) => {
        tester.test(
          100,
          assert.ok,
          l.ref !== 'nofollow',
          `Internal nofollow links are bad news. [${l.innerText}](${l.href})`,
        );
      });

      internal
        .filter((l) => l.href.includes('http'))
        .forEach((l) => {
          tester.test(
            assert.ok,
            l.href.includes('https'),
            `Internal links should use https: [${l.innerText}](${l.href}) does not.`,
          );
          tester.test(
            100,
            assert.ok,
            !l.href.includes('.html'),
            `Internal links should not link to .html documents: [${l.innerText}](${l.href}) does.`,
          );
        });
    },
  },
  {
    name: 'Outbound links',
    description: 'Checks for the number of outbound links',
    testData: {
      preferences: defaultPreferences,
      response: {
        ok: true,
        url: 'https://nicholasreese.com/',
      },

      result: {
        aTags: [
          {
            tag: 'a',
            innerHTML: '← Home',
            innerText: '← Home',
            href: '/',
            class: 'svelte-bvr7j8',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
          {
            tag: 'a',
            innerHTML: 'Elder.js',
            innerText: 'Elder.js',
            href: 'https://elderguide.com/tech/elderjs/',
            class: 'svelte-1tkpvyy',
          },
        ],
      },
    },
    validator: async (payload, tester) => {
      const external = payload.result.aTags.filter(
        (l) => !l.href.includes(payload.response.host) && l.href.includes('http'),
      );

      tester.lint(assert.ok, external.length < 50, `Heads up, this page has more than 50 outbound links.`);
    },
  },

  {
    name: 'Images',
    description: 'Checks for alt tags on images.',
    testData: {
      preferences: defaultPreferences,
      response: {
        ok: true,
        url: 'https://nicholasreese.com/',
      },

      result: {
        imgs: [
          {
            tag: 'img',
            innerHTML: '',
            innerText: '',
            src: 'https://elderguide.com/images/elderjs-hooks-v100.png',
            alt: 'Elder.js hook Lifecycle',
            style: 'max-width:100%; margin:1rem 0;',
          },
        ],
      },
    },
    validator: async (payload, tester) => {
      payload.result.imgs.forEach((i) =>
        tester.lint(assert.ok, i.alt && i.alt.length > 0, `Images should have alt tags. ${i.src} does not`),
      );
    },
  },
];
