# Killer Mortal Standalone

Run the side launcher and proxy:

```sh
node standalone/server.js
```

Then open `http://localhost:4173`.

The launcher accepts URLs like:

```text
https://mjai.ekyu.moe/killerducky/?data=/report/52cad5a44a819221.json
```

The proxy only allows `https://mjai.ekyu.moe/report/*.json`, then the existing 3D GUI opens at `/new/`.
