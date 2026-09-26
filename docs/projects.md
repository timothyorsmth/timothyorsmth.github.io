# Project content and playable levels

Edit `src/data/projects_list.json` to add cards. Each entry needs a unique `id`, `title`, `image`, `tags` array, and `markdown` path. Paths are relative to `public/` and respect the Vite base URL.

Copy `public/projects/template.md` to `public/projects/my-project.md`, replace its text and image paths, then set the entry's `markdown` to `projects/my-project.md`. The existing starter projects retain their empty placeholder files until you add your content.

## Define your own chunks

Put `<!-- chunk -->` on its own line between cards. You choose every word and every boundary. Headings, blank lines, and horizontal rules never automatically split a card. A marker inside a fenced code example is literal text. Empty chunks are ignored. A file without markers becomes one card.

Cards alternate left and right in reading order. Their height follows your content. Each card is a solid golf wall. Water is randomized once when the course mounts and forms four ponds per card, two poking out from each side. Ponds extend farther out on desktop and have staggered random positions. The spaces between cards stay clear, and smaller protrusions on mobile preserve room to putt past. Water sends the ball back to its starting position. Resizing and ordinary rerenders do not reroll the water. Drag the ball to putt; normal reading, scrolling, links, and text selection still work.

## Supported Markdown

Each project course ends with a golf hole. Sinking the ball plays the existing sinking animation, then returns to the home projects section. The text below the hole is also a clickable, keyboard-accessible return link.

- Headings: `# H1`, `## H2`, and `### H3`.
- Images: `![Useful alt text](./image.webp)`; paths resolve relative to the Markdown file.
- Inline LaTeX: `$E = mc^2$`; display LaTeX uses `$$` on separate lines around the equation. KaTeX renders supported LaTeX maths, not entire LaTeX documents.
- Coloured text: `[text](#color-blue)`. Available names: `green`, `red`, `blue`, `purple`, `gold`. These reserved links render as spans, not navigation.
- Code: fenced blocks with an optional language label, such as three backticks followed by `typescript`. Blocks scroll horizontally; syntax highlighting is not enabled.
- Standard paragraphs, lists, emphasis, blockquotes, and links are supported. Raw HTML is not executed.

The template is not assigned to a real project automatically. To preview it, temporarily point a project entry's `markdown` at `projects/template.md`.

Empty files show a coming-soon message; failed requests show a retry message. Unknown IDs show a project-not-found message. Project navigation uses `GolfLink`; home retains its existing saved ball and scroll behavior.



An additional reset pond reaches inward from the opposite page edge beside each card. Its vertical position varies independently across the card height. Shorter card ponds and a wider setback leave at least 192px between opposing pond tips, including on mobile; gaps between cards remain clear.



The project course has a minimum width of 640px so the 192px passage and readable cards fit. Narrow screens can scroll horizontally.


## Passing wind

Every other card row has a local wind zone, alternating leftward and rightward. Each zone waits 2–7 seconds on entry, blows for 5–10 seconds including one-second fades, then rests for 12–22 seconds before repeating. These timings are chosen once per mounted zone. Physics strength and particle opacity use the same clock. Breeze streaks render below cards and water, never intercept clicks, and become stationary indicators when reduced motion is enabled.

Wind gently affects both rolling and resting balls inside a zone, tapering near its edges. Holding the ball to aim suspends drift. Passive drift does not pull the camera; normal shots retain camera following. Wind stops affecting a sunk ball, and existing wall, reset, and hole behavior remains active. Timing and force helpers live in `src/Golf/wind.ts`; the visual zone and DOM sampling live in ProjectsView.
