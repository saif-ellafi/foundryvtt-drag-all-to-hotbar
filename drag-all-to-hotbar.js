_dth_MACRO_KEY = '__MACRO_ID__';

function _dthCreateAndAssign(dataSlot, name, type, command, img) {
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

Hooks.once('ready', function() {

  libWrapper.register('drag-all-to-hotbar', 'Hotbar.prototype._createDocumentSheetToggle', async function (wrapped, ...args) {

    let appName;
    let command;

    let data = args[0];

    switch (args[0]?.constructor.name) {
      case 'RollTable': {
        let table;
        if (data.pack)
          table = await game.packs.get(data.pack).getDocument(data.id);
        else
          table = game.tables.get(data.id);
        if (!table)
          return;
        appName = 'Draw from: ' + table.name;
        command = `_dthDrawFromTable('${data.id}'${data.pack ? `, '${data.pack}'` : ''});`;
        return _dthCreateAndAssign(data.slot, appName, 'script', command, table.img);
      }
      case 'PlaylistSound': {
        appName = data.name;
        command = `_dthPlaySound('${data.parent.id}', '${data.id}', '${_dth_MACRO_KEY}');`;
        return _dthCreateAndAssign(data.slot, appName, 'script', command, 'icons/svg/sound.svg');
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
        return _dthCreateAndAssign(data.slot, appName, 'script', command, 'icons/svg/sound.svg');
      }
      default: {
        return wrapped(...args);
      }
    }
  }, 'MIXED');


});