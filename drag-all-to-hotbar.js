function _dthCreateAndAssign(slot, dataSlot, name, type, command, img, includeMacroId) {
  Macro.create({name: name, type: type, command: command, img: img}).then(newMacro => {
    if (includeMacroId) {
      command = command.replace('__MACRO_ID__', newMacro.id);
      newMacro.update({command: command});
    }
    game.user.assignHotbarMacro(newMacro, slot, {fromSlot: dataSlot});
  });
}

function _dthDrawFromTable(tableId) {
  game.tables.get(tableId).draw();
}

function _dthOpenJournal(journalId) {
  game.journal.get(journalId).sheet.render(true);
}

function _dthOpenActor(actorId) {
  game.actors.get(actorId).sheet.render(true);
}

function _dthOpenItem(itemId) {
  game.items.get(itemId).sheet.render(true);
}

function _dthPlaySound(playlistId, soundId, macroId) {
  const playlist = game.playlists.get(playlistId);
  const sound = playlist.sounds.get(soundId);
  if (playlist.data.sounds.contents.length && !sound.playing) {
    playlist.playSound(sound);
  } else if (playlist.data.sounds.contents.length) {
    playlist.stopSound(sound);
  }
}

function _dthPlayPlaylist(playlistId, macroId) {
  const playlist = game.playlists.get(playlistId);
  if (playlist.data.sounds.contents.length && !playlist.playing) {
    playlist.playAll();
    game.macros.get(macroId).update({img: 'icons/svg/sound-off.svg'});
  } else if (playlist.data.sounds.contents.length) {
    playlist.stopAll();
    game.macros.get(macroId).update({img: 'icons/svg/sound.svg'});
  }
}

Hooks.once('renderSidebar', function() {
  // This is needed to allow users drag actors into the Hotbar. Gives specific permission to the event 'dragstart'
  // Note: This WON'T give permissions to create tokens, just to initiate the drag & drop in the UI
  if (!game.user.hasPermission('TOKEN_CREATE')) // Don't do anything if users already can do this normally
    ui.actors._dragDrop[0].permissions["dragstart"] = () => true;
});

Hooks.once('ready', function() {

  Hooks.on('hotbarDrop', function(hotbarProps, data, slot) {

    let command;
    let appName;

    switch (data.type) {
      case 'RollTable': {
        const table = game.tables.get(data.id);
        appName = 'Draw from: ' + table.name;
        command = `_dthDrawFromTable('${data.id}');`;
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, table.data.img);
        break;
      }
      case 'Actor': {
        const actor = game.actors.get(data.id);
        appName = actor.name;
        command = `_dthOpenActor('${data.id}');`;
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, actor.data.img);
        break;
      }
      case 'Item': {
        const item = game.items.get(data.id);
        if (!item)
          return;
        appName = item.name;
        command = `_dthOpenItem('${data.id}');`;
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, item.data.img);
        break;
      }
      case 'JournalEntry': {
        const journal = game.journal.get(data.id);
        appName = journal.name;
        command = `_dthOpenJournal('${data.id}');`;
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, 'icons/svg/book.svg');
        break;
      }
      case 'PlaylistSound': {
        const sound = game.playlists.get(data.playlistId).sounds.get(data.soundId);
        appName = sound.name;
        command = `_dthPlaySound('${data.playlistId}', '${data.soundId}', '__MACRO_ID__');`;
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, 'icons/svg/sound.svg', true);
        break;
      }
      case 'Playlist': {
        const playlist = game.playlists.get(data.id);
        if (playlist.mode === -1) {
          ui.notifications.warn("Cannot drag a Soundboard Playlist. Please drag its sounds individually instead")
          break;
        }
        appName = playlist.name;
        command = `_dthPlayPlaylist('${data.id}', '__MACRO_ID__');`;
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, 'icons/svg/sound.svg', true);
        break;
      }
    }

  });

});