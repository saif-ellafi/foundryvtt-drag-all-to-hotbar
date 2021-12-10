function _dthCreateAndAssign(slot, dataSlot, name, type, command, img) {
  Macro.create({name: name, type: type, command: command, img: img}).then(newMacro => {
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

function _dthPlayPlaylist(playlistId) {
  const playlist = game.playlists.get(playlistId);
  if (!playlist.playing)
    playlist.playAll();
  else
    playlist.stopAll();
}

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
      case 'Playlist': {
        const playlist = game.playlists.get(data.id);
        appName = playlist.name;
        command = `_dthPlayPlaylist('${data.id}');`;
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, 'icons/svg/sound.svg');
        break;
      }
    }

  });

});