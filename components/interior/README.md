# Interior adaptations

Adapted from [ddoemonn/interior](https://github.com/ddoemonn/interior), copyright (c) 2026 ozzy, under the included MIT license.

The headless dropdown, press-depth, and clipboard hooks retain the upstream behavior with React lifecycle adjustments. The survey's buttons, choice rows, searchable country picker, floating fields, inline feedback, progress fill, and step transitions adapt these Interior examples:

- `press-depth.tsx`, `loading-button.tsx`
- `dropdown.tsx`, `floating-label.tsx`, `inline-validation.tsx`
- `poll-results.tsx`, `progress-bar.tsx`, `wizard-steps.tsx`
- `copy-button.tsx`

Styles use this app's brand tokens. Question navigation, server validation, and versioned responses remain owned by the survey. Decorative motion is removed when the browser requests reduced motion.
