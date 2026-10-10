# event-board

A campus event board: a small Express server with a JSON API, and a web page for browsing, adding and deleting events. Events are saved in `data/events.json`.

## Running it

You need Node.js 18 or newer.

```
npm install
npm start       # http://localhost:3000
npm test
```

## API

| Request | Does |
|---|---|
| `GET /events` | All events |
| `POST /events` | Creates an event. Body: `{"title", "date", "location", "description", "tags"}` |
| `PUT /events/{id}` | Edits an event (admin only). Body is the same as `POST /events` |
| `DELETE /events/{id}` | Deletes an event (admin only) |

`PUT` and `DELETE` need an admin token. Set the `ADMIN_TOKEN` environment variable before starting the server and send it as `Authorization: Bearer <token>`. If `ADMIN_TOKEN` isn't set, or the token doesn't match, they return `401`.

```
curl -X POST localhost:3000/events -H 'Content-Type: application/json' \
  -d '{"title": "Git workshop", "date": "2026-10-20", "location": "Lab 2", "tags": ["Tech"]}'
```

## How it's supposed to work

- Events are listed in date order, earliest first.
- Title and location are required and can't be just spaces. The date must be a real date written `YYYY-MM-DD`. Anything else is a `400`.
- Deleting an id that doesn't exist is a `404` (with a valid admin token; without one it is a `401`).
- If the event can't be saved to disk, the API returns `500` and the event isn't added.
- The tag filter ignores capital letters: `tech` finds events tagged `Tech`.
- Titles, locations, descriptions and tags are shown as plain text. If one contains HTML, it's displayed, not run.

## Code

- `src/server.js`: the API, and saving to `data/events.json`
- `src/validator.js`: checks a new event
- `public/`: the web page (`index.html`, `app.js`, `style.css`)
- `tests/`: tests, run with `npm test`

## Contributing

Fork the repo, make your changes on a new branch, and open a pull request. Run `npm test` first.

If you find a bug, open an issue with the steps to reproduce it, what you expected, and what happened instead.

Part of Source Start by CSI SPIT. MIT licensed.
