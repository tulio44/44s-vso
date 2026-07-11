# 44's VSO

44's VSO is a cinematic VS overlay module for Foundry VTT. It gives combat scenes a fighting game-style presentation with configurable ally and enemy lineups, character portraits, defeated states, and quick controls for the GM.

[![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v11--v13-orange)](https://foundryvtt.com/)
[![Latest Manifest](https://img.shields.io/badge/manifest-latest-blue)](https://github.com/tulio44/44s-vso/releases/latest/download/module.json)
[![Support](https://img.shields.io/badge/support-buy%20me%20a%20coffee-yellow)](https://buymeacoffee.com/tulio44)

## Features

- Fighting game-inspired VS overlay for active combat scenes.
- Separate ally and enemy columns controlled by the GM.
- Persistent overlay mode or one-shot combat intro mode with configurable timing.
- Per-actor image framing with zoom, position, and flip controls.
- Custom display names, hidden names, and top/bottom name placement.
- Player-owned actors can adjust their own overlay portrait.
- Defeated/recovered visual states for combatants.
- Hide, reveal, remove, drag, drop, and reorder entries from the configuration panel.
- Optional overlay music that starts with the VS overlay from a selected Foundry playlist and sound.
- English and Brazilian Portuguese localization.

## Installation

Use this manifest URL in Foundry's module installer:

```text
https://github.com/tulio44/44s-vso/releases/latest/download/module.json
```

After installing, enable **44's VSO** in your world modules.

## Usage

The GM can open the 44's VSO controls from the Token scene controls. Use the configuration window to assign combatants to each side, drag actors/tokens/combatants into the lineup, hide or reveal entries, reorder them, and manage defeated states.

The configuration window also includes **Overlay music**. Choose a Foundry playlist and one sound from that playlist to have the GM client start that track whenever the VS overlay appears. The module stops the selected track when the overlay is removed, disabled, or finishes its intro sequence.

Players with ownership of an actor can open that actor's sheet and use the VS image adjustment control to frame their own portrait for the overlay, set a display name, and hide or show that name.

## Compatibility

44's VSO currently targets Foundry VTT versions 11 through 13.

## Animation Notice

44's VSO relies on browser rendering and CSS/Web Animations. Depending on the browser, hardware acceleration, system performance, and local settings, animations may stutter, play inconsistently, or fail to run as intended.

## Support

If 44's VSO adds a little extra drama to your table, you can support development here:

<p align="center">
  <a href="https://buymeacoffee.com/tulio44">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" width="210">
  </a>
</p>

<p align="center">
  <a href="https://buymeacoffee.com/tulio44">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=12&data=https%3A%2F%2Fbuymeacoffee.com%2Ftulio44" alt="Donation QR code" width="160">
  </a>
</p>

Direct link: https://buymeacoffee.com/tulio44

Issues and suggestions can be opened on GitHub:

https://github.com/tulio44/44s-vso/issues
