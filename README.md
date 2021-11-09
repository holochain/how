# how

A tool for how the Holochain community comes to alignment about technical and social matters.

##  Background

In the world of Holochain DNAs the ecosystem needs a way to converge on technicial standards, including changes and feature additions to Holochain and it's HDK, classes of DNAs that meet specific needs, and technical community social processe like this one.  This is similar to IETF RFC process, or the Ethereum Request for Comment (ERC) process that standardized for example, on ERC-20 for describing the behavior of tokens.

We want this process to maximize collective alignment both on specific needs but in relations to other emerging standards.  Thus we propose the Holochain Emerging Standards protocol as embodied in this hApp.

## Design

For more details read the [design documents](DESIGN.md).

## Installation

1. Install the holochain dev environment: https://developer.holochain.org/docs/install/
2. Clone this repo: `git clone https://github.com/lightningrodlabs/how && cd ./how`
3. Enter the nix shell: `nix-shell`

## Building the DNA

- Build the DNA (assumes you are still in the nix shell for correct rust/cargo versions from step above):
  - Assemble the DNA:

```bash
npm run build:happ
```

### Running the DNA tests
```bash
npm run test
```

## UI

To test out the UI:

``` bash
npm run start
```

## Package

To package the web happ:

``` bash
npm run package
```

You'll have the `how.webhapp` in `workdir`, and it's component `how.happ` in `dna/workdir/happ`, and `ui.zip` in `ui/apps/how`.

## License
[![License: CAL 1.0](https://img.shields.io/badge/License-CAL%201.0-blue.svg)](https://github.com/holochain/cryptographic-autonomy-license)

  Copyright (C) 2021, Holochain Foundation

This program is free software: you can redistribute it and/or modify it under the terms of the license
provided in the LICENSE file (CAL-1.0).  This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
