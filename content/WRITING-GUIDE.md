# How articles are written for therealflow.tv

Every video page and every podcast episode page carries an article written from that video's or episode's own content. Articles are written for people first, and structured so Google and AI answer engines (ChatGPT, Perplexity, Google AI Overviews) can quote them.

## Where articles live

| Page | Article file | Source material |
| --- | --- | --- |
| Video | `content/videos/<youtube id>.json` | The video transcript in Mario's TikTok campaign folder |
| Podcast episode | `content/podcast/<episode slug>.json` | `data/transcripts/podcast/<episode slug>.txt` (transcribed automatically) |

The YouTube id and the slug come from `data/videos.json` and `data/episodes.json`. The site picks up a new file on its next build.

## File format (JSON)

```json
{
  "title": "H1 of the page. Clear, uses the words people search, max ~75 characters",
  "seoTitle": "Browser/Google title, 60 characters or fewer",
  "description": "Meta description, 160 characters or fewer, says what the reader will learn",
  "answer": "Short answer, 40 to 70 words, a complete answer to the title on its own",
  "keywords": ["3 to 6 search phrases"],
  "body": "Markdown. Sections with ## headings. Lists where they help.",
  "takeaways": ["4 to 5 one-sentence takeaways"],
  "faq": [["Question people actually search?", "Answer in 1 to 3 sentences."]],
  "number": 43,
  "written": "YYYY-MM-DD",
  "source": "video transcript | podcast transcript"
}
```

## Rules

- **`number` (videos only).** The 3-digit production number from Mario's folder name (for example `043 - Fix the Doubt, Not the Price` → 43). The site orders videos by this number, newest production first. Leave it out for podcast clips.

- **Derived, not copied.** Keep Mario's ideas, examples and numbers, in new wording. Never paste the transcript. Never add claims, figures or examples that are not in the source or are not common, safe knowledge.
- **Answer first.** The `answer` must stand alone as a quotable answer. The first paragraph of the body sets up the problem in plain words.
- **Length.** Videos: 350 to 600 words of body. Podcast episodes: 600 to 1,000 words.
- **Structure.** 3 to 6 `##` sections whose headings say what the section answers. Use numbered lists for steps, bullets for checklists, a worked example when the source has numbers.
- **FAQ.** 3 or 4 questions people really type into Google, each answered directly.
- **Voice.** Mario, plain English, short sentences, confident and practical. First person is fine ("in my experience"). No contractions (write "do not", "cannot", "it is").
- **Brand.** Never mention SuitesFlow or any product by name. Describe the idea instead (for example "a walkthrough of every unit").
- **Podcast clips on YouTube.** If a video is a clip of a podcast episode, write a shorter article (300 to 450 words) focused on the clip's single point, with different headings and FAQ from the episode article, and end the body with a sentence linking to the full episode at `/podcast/<slug>/`.
- **Markets and numbers.** Present market figures as reported at the time ("as of October 2026"), with the source name when the transcript gives one. Opinions are labelled as opinion, never as advice.
- **Checks before saving.** Valid JSON, `seoTitle` ≤ 60 characters, `description` ≤ 160 characters, no SuitesFlow mention, no contractions.
