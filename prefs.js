// Web Search Provider for GNOME Shell
// Copyright (C) 2015, 2017 Contributors, Bahodir Mansurov; 2017 Moritz Rakow
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

/* globals imports */
/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "^init|buildPrefsWidget$" }] */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Pango = imports.gi.Pango;

const ListView = new GObject.Class({
  Name: 'WebSearchProvider.SearchEngineListView',
  GTypeName: 'SearchEngineListView',
  Extends: Gtk.ListBox,

  _init: function (params) {
    this.parent(params);

    // this.selection_mode = Gtk.SelectionMode.MULTIPLE; // Unusable UI.
  },

  addListItem: function (iconPath, primaryText, secondaryText, isActive) {
    // GTK automatically inserts 2px padding on all sides of GtkListBoxRow. It
    // is not possible to change this. For a desired height of 60px (Material
    // Design), height_request needs to be 56px. The box needs to have -2px
    // smaller start and end margins (to get to a total of 16px).
    let itemBox = new Gtk.Box({
      height_request: 56, // + 2px top + 2px bottom padding from GtkListBoxRow
      margin_start: 14, // + 2px padding from GtkListBoxRow
      margin_end: 14, // +2px padding from GtkListBoxRow
      spacing: 16 // between items in box
    });

    // Avatar icon on the left
    itemBox.pack_start(
      new Gtk.Image({
        gicon: Gio.icon_new_for_string(iconPath),
        icon_size: Gtk.IconSize.DND, // Gtk.IconSize.DND is the "drag and
        // drop" size at 32x32.
        width_request: 40 // Material Design icon size. 32px icon gets centered.
      }),
      false, // does not expand if there is extra space
      false, // use extra space from expanding for padding (irrelevant here)
      0 // no padding
    );

    // Two rows of text (primary and secondary) in  the central part
    let twoRowTextBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      valign: Gtk.Align.CENTER
    });

    // Primary text would be the search engine name.
    twoRowTextBox.add(new Gtk.Label({
      label: '<big>' +
      GLib.markup_escape_text(primaryText, primaryText.length) +
      '</big>',
      use_markup: true,
      opacity: 0.87, // from Google's Material Design CSS for lists
      xalign: 0, // 0 means left align.
      // Limit the line length. OpenSearch.xml has a character limit of 48
      // for the LongName element, which is used here as a reference point.
      // The actual number of characters per line may differ to this
      // property.
      max_width_chars: 60,
      // Ellipsisation, needed for max_width_chars to have any effect at all.
      ellipsize: Pango.EllipsizeMode.END
    }));

    // Secondary Text would be either a description, or the keywords.
    twoRowTextBox.add(new Gtk.Label({
      label: secondaryText,
      opacity: 0.54, // from Google's Material Design CSS for lists
      xalign: 0,
      max_width_chars: 60,
      ellipsize: Pango.EllipsizeMode.END
    }));

    itemBox.add(twoRowTextBox);

    // activation toggle on the right
    itemBox.pack_end(
      new Gtk.Switch({ valign: Gtk.Align.CENTER }),
      false, // does not expand if there is extra space
      false, // use extra space from expanding for padding (irrelevant here)
      0 // padding, 0 here because of GTK's invariable 2px
      // auto-padding around GtkListBoxRow.
    );

    this.add(itemBox);
  }
});

const SearchSettingsWidget = new GObject.Class({
  Name: 'WebSearchProvider.SearchSettingsWidget',
  GTypeName: 'SearchSettingsWidget',
  Extends: Gtk.Box,

  _init: function (params) {
    this.parent(params);

    this.margin = 16;
    this.orientation = Gtk.Orientation.VERTICAL;

    this.add(new Gtk.Label({
      label: '<big><b>Search engines</b></big>',
      use_markup: true,
      opacity: 0.87, // Material Design
      xalign: 0,
      margin: 8
    }));

    let scrolledWindow = new Gtk.ScrolledWindow({
      width_request: 320,
      height_request: 240,
      hexpand: true,
      vexpand: true
    });
    let listView = new ListView();
    scrolledWindow.add(listView);
    this.add(scrolledWindow);

    // Dummy content for list view. TODO: Replace with settings importer.
    let wikipediaIconPath = Me.path + '/search-engine-icons/wikipedia.ico';
    let duckduckgoIconPath = Me.path + '/search-engine-icons/duckduckgo.png';
    let youtubeIconPath = Me.path + '/search-engine-icons/youtube.ico';
    listView.addListItem(duckduckgoIconPath, 'DuckDuckGo', 'no keywords', 'off');
    listView.addListItem(wikipediaIconPath, 'Wikipedia (en)', 'no keywords', 'off');
    listView.addListItem(youtubeIconPath, 'YouTube Video Search', 'no keywords', 'off');

    // Bottom toolbar with Add and Delete buttons
    let toolbar = new Gtk.Toolbar({ icon_size: Gtk.IconSize.SMALL_TOOLBAR });
    toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);
    toolbar.add(new Gtk.ToolButton({ icon_name: 'list-add-symbolic' }));
    toolbar.add(new Gtk.ToolButton({ icon_name: 'list-remove-symbolic' }));
    this.add(toolbar);
  }
});

function init () {}

function buildPrefsWidget () {
  let widget = new SearchSettingsWidget();
  widget.show_all();

  return widget;
}
