# Checklist App

This is the source for the hosted checklist app with:
- Supabase backend (auth + shared instances)
- Admin Mode for editing the master template
- Runner Mode for users completing checklists
- Multi-line task descriptions (Style 2)
- Master/Instance merge logic
- JSON state storage
- GitHub Pages hosting

## Local development

1. Clone the repo.
2. Update `js/supabase-config.js` with your Supabase URL + anon key.
3. Open `index.html` in a local server (`npx serve` works).
4. Push to GitHub, enable GitHub Pages.

## Supabase setup

- Create tables:
  - profiles
  - projects
  - instances
  - instance_collaborators
- Add Row Level Security policies.
- Connect via public anon key in `supabase-config.js`.

