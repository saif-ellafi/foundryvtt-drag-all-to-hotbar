_dth_MACRO_KEY = '__MACRO_ID__';

function _dthCreateAndAssign(name, type, command, img, slot) {
  let macro = Macro.implementation.create({
    name: name,
    type: type,
    img: img,
    command: command
  });
  macro.then(newMacro => {
    if (command.includes(_dth_MACRO_KEY)) {
      command = command.replace(_dth_MACRO_KEY, newMacro.id);
      newMacro.update({command: command});
    }
    if (slot) {
      game.user.assignHotbarMacro(newMacro, slot);
    }
  })
  return macro;
}

function _dthDrawFromTable(tableId, packId) {
  if (packId)
    game.packs.get(packId).getDocument(tableId).then(doc => doc.draw());
  else
    game.tables.get(tableId)?.draw();
}

function _dthPlaySound(playlistId, soundId, macroId) {
  const playlist = game.playlists.get(playlistId);
  const sound = playlist.sounds.get(soundId);
  if (playlist.sounds.contents.length && !sound.playing) {
    playlist.playSound(sound);
    game.macros.get(macroId).update({img: 'icons/svg/sound-off.svg'});
  } else if (playlist.sounds.contents.length) {
    playlist.stopSound(sound);
    game.macros.get(macroId)?.update({img: 'icons/svg/sound.svg'});
  }
}

function _dthPlayPlaylist(playlistId, macroId) {
  const playlist = game.playlists.get(playlistId);
  if (playlist.sounds.contents.length && !playlist.playing) {
    playlist.playAll();
    game.macros.get(macroId).update({img: 'icons/svg/sound-off.svg'});
  } else if (playlist.sounds.contents.length) {
    playlist.stopAll();
    game.macros.get(macroId)?.update({img: 'icons/svg/sound.svg'});
  }
}

function _dthOpenPack(packName) {
  const targetPack = game.packs.get(packName);
  if (!targetPack)
    return;
  const openPack = Object.values(ui.windows).find(w => w.metadata?.label === targetPack.title);
  if (openPack?.rendered && openPack._minimized)
    openPack.maximize().then(() => openPack.bringToTop());
  else if (openPack?.rendered)
    openPack.bringToTop();
  else if (!openPack)
    game.packs.get(packName).render(true);
}

Hooks.once('ready', function() {

  libWrapper.register('drag-all-to-hotbar', 'Hotbar.prototype._createDocumentSheetToggle', async function (wrapped, ...args) {

    let appName;
    let command;

    let data = args[0];

    switch (args[0]?.constructor.name) {
      case 'PlaylistSound': {
        appName = data.name;
        command = `_dthPlaySound('${data.parent.id}', '${data.id}', '${_dth_MACRO_KEY}');`;
        return _dthCreateAndAssign(appName, 'script', command, 'icons/svg/sound.svg');
      }
      case 'Playlist': {
        const playlist = game.playlists.get(data.id);
        if (!playlist)
          return;
        if (playlist.mode === -1) {
          ui.notifications.warn("Cannot drag a Soundboard Playlist. Please drag its sounds individually instead")
          break;
        }
        appName = playlist.name;
        command = `_dthPlayPlaylist('${data.id}', '${_dth_MACRO_KEY}');`;
        return _dthCreateAndAssign(appName, 'script', command, 'icons/svg/sound.svg');
      }
      default: {
        return wrapped(...args);
      }
    }
  }, 'MIXED');


});

Hooks.on('hotbarDrop', function(hotbar, pack, slot) {
  switch(pack.type) {
    case 'Compendium': {
      appName = game.packs.get(pack.id).title;
      command = `_dthOpenPack('${pack.id}');`;
      _dthCreateAndAssign('Compendium: ' + appName, 'script', command, 'icons/svg/temple.svg', slot);
      break;
    }
  }
});

Hooks.on('createMacro', function(macro) {
  if (macro.command.includes('toggleDocumentSheet') && macro.command.includes('Actor')) {
    const id = macro.command.match('Actor\.(.*)"')[1];
    if (id) {
      const img = game.actors.get(id).img;
      macro.update({img, img});
    }
  } else if (macro.command.includes('toggleDocumentSheet') && macro.command.includes('Cards')) {
    const id = macro.command.match('Cards\.(.*)"')[1];
    if (id) {
      const img = game.cards.get(id).img;
      macro.update({img, img});
    }
  }
});