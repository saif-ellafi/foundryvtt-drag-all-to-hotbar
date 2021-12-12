_dth_MACRO_KEY = '__MACRO_ID__';

function _dthCreateAndAssign(slot, dataSlot, name, type, command, img) {
  Macro.create({name: name, type: type, command: command, img: img}).then(newMacro => {
    if (command.includes(_dth_MACRO_KEY)) {
      command = command.replace(_dth_MACRO_KEY, newMacro.id);
      newMacro.update({command: command});
    }
    game.user.assignHotbarMacro(newMacro, slot, {fromSlot: dataSlot});
  });
}

function _dthDrawFromTable(tableId, packId) {
  if (packId)
    game.packs.get(packId).getDocument(tableId).then(doc => doc.draw());
  else
    game.tables.get(tableId)?.draw();
}

function _dthOpenJournal(journalId, packId) {
  const openJournal = Object.values(ui.windows).find(w => w.document?.id === journalId);
  if (openJournal?.rendered && openJournal._minimized)
    openJournal.maximize().then(() => openJournal.bringToTop());
  else if (openJournal?.rendered)
    openJournal.bringToTop();
  else if (packId)
    game.packs.get(packId).getDocument(journalId).then(doc => doc.sheet.render(true));
  else
    game.journal.get(journalId)?.sheet.render(true);
}

function _dthOpenActor(actorId, packId) {
  const openActor = Object.values(ui.windows).find(w => w.document?.id === actorId);
  if (openActor?.rendered && openActor._minimized)
    openActor.maximize().then(() => openActor.bringToTop());
  else if (openActor?.rendered)
    openActor.bringToTop();
  else if (packId)
    game.packs.get(packId).getDocument(actorId).then(doc => doc.sheet.render(true));
  else
    game.actors.get(actorId)?.sheet.render(true);
}

function _dthOpenItem(itemId, packId) {
  const openItem = Object.values(ui.windows).find(w => w.document?.id === itemId);
  if (openItem?.rendered && openItem._minimized)
    openItem.maximize().then(() => openItem.bringToTop());
  else if (openItem?.rendered)
    openItem.bringToTop();
  else if (packId)
    game.packs.get(packId).getDocument(itemId).then(doc => doc.sheet.render(true));
  else
    game.items.get(itemId)?.sheet.render(true);
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

Hooks.once('renderSidebar', function() {
  // This is needed to allow users drag actors into the Hotbar. Gives specific permission to the event 'dragstart'
  // Note: This WON'T give permissions to create tokens, just to initiate the drag & drop in the UI
  if (!game.user.hasPermission('TOKEN_CREATE')) // Don't do anything if users already can do this normally
    ui.actors._dragDrop[0].permissions["dragsend"] = () => true;
  const compendiumDragDrop = new DragDrop({
    dragSelector: ".compendium-pack",
    dropSelector: ".compendium-list",
    callbacks: {
      dragstart: function (event) {
        let li = event.currentTarget.closest(".directory-item");
        const dragData = { type: 'Compendium', pack: li.getAttribute('data-pack') };
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        this._dragType = dragData.type;
      }.bind(ui.compendium),
    }
  });
  ui.compendium._dragDrop.push(compendiumDragDrop);
});

Hooks.once('ready', function() {

  Hooks.on('hotbarDrop', async function(hotbarProps, data, slot) {

    let command;
    let appName;

    switch (data.type) {
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
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, table.data.img);
        break;
      }
      case 'Actor': {
        let actor;
        if (data.pack)
          actor = await game.packs.get(data.pack).getDocument(data.id);
        else
          actor = game.actors.get(data.id);
        if (!actor)
          return;
        appName = actor.name;
        command = `_dthOpenActor('${data.id}'${data.pack ? `, '${data.pack}'` : ''});`;
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, actor.data.img);
        break;
      }
      case 'Item': {
        let item;
        if (data.pack)
          item = await game.packs.get(data.pack).getDocument(data.id);
        else
          item = game.items.get(data.id);
        if (!item)
          return;
        appName = item.name;
        command = `_dthOpenItem('${data.id}'${data.pack ? `, '${data.pack}'` : ''});`;
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, item.data.img);
        break;
      }
      case 'JournalEntry': {
        let journal;
        if (data.pack)
          journal = await game.packs.get(data.pack).getDocument(data.id);
        else
          journal = game.journal.get(data.id);
        if (!journal)
          return;
        appName = journal.name;
        command = `_dthOpenJournal('${data.id}'${data.pack ? `, '${data.pack}'` : ''});`;
        // in Foundry, journals may not have icons but in compendiums or by module they might!
        let journalIcon = journal.data.img ? journal.data.img : 'icons/svg/book.svg';
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, journalIcon);
        break;
      }
      case 'PlaylistSound': {
        const sound = game.playlists.get(data.playlistId).sounds.get(data.soundId);
        if (!sound)
          return;
        appName = sound.name;
        command = `_dthPlaySound('${data.playlistId}', '${data.soundId}', '${_dth_MACRO_KEY}');`;
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, 'icons/svg/sound.svg');
        break;
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
        _dthCreateAndAssign(slot, data.slot, appName, 'script', command, 'icons/svg/sound.svg');
        break;
      }
      case 'Compendium': {
        const pack = game.packs.get(data.pack)
        if (!pack)
          return;
        appName = pack.title;
        command = `_dthOpenPack('${data.pack}');`;
        _dthCreateAndAssign(slot, data.slot, 'Compendium: ' + appName, 'script', command, 'icons/svg/temple.svg');
      }
    }

  });

});