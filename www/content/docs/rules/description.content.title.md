---
title: description.content.title
summary: "The description shares at least one meaningful word with the title. See what the description.content.title rule checks, why it matters, and how to configure it."
---

The description shares at least one meaningful word with the title.

**Why:** A description that shares no words with the title may belong to another page. Common words such as "the" and "and" do not count. The singular and plural of a word match, such as "story" and "stories".

**When off:** any description passes.

```html
<!-- ✗ Fails -->
<title>The Bakery</title>
<meta name="description" content="The shop in town." />

<!-- ✓ Passes -->
<title>The Bakery</title>
<meta name="description" content="Our bakery bakes bread every morning." />

<title>Our Breads</title>
<meta name="description" content="Each bread is baked every morning." />
```
