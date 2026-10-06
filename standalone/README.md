# Killer Mortal Standalone

Run the side launcher and proxy:

```sh
node standalone/server.js
```

Then open `http://localhost:4173`.

The server listens only on this computer's loopback interface, keeping local report files off the network.

The launcher accepts URLs like:

```text
https://mjai.ekyu.moe/killerducky/?data=/report/52cad5a44a819221.json
```

The proxy only allows `https://mjai.ekyu.moe/report/*.json`, rejects credentials and alternate ports, and does not follow redirects. The 3D GUI opens at `/new/`.
