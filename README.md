# Web Search Provider for GNOME Shell

This GNOME Shell extension enables you to search the web directly from the
shell overview.

It is very much a work in progress.

## Installation

1.  To install, clone this repository into the folder for locally installed
    GNOME Shell extensions:

    ```bash
    $ git clone https://github.com/mrakow/gnome-shell-web-search-provider ~/.local/share/gnome-shell/extensions/gnome-shell-web-search-provider@mrakow.github.com
    ```
2.  Restart GNOME Shell by typing <kbd>Alt</kbd>+<kbd>F2</kbd>, <kbd>r</kbd>,
    and then <kbd>Enter</kbd>.
3.  Enable the Web Search Provider extension in GNOME Tweak Tool or at
    <https://extensions.gnome.org/local>.

## Configuration

Search engines are saved in the file <config.json>. By default, DuckDuckGo and
Wikipedia are enabled and YouTube is disabled.

To disable a search engine, set its key `disabled` to `true`.

To add a search engine, add an entry in the config file with it’s display
name as the key. Add more information with the following entries:

-   `urlTemplate` (required): A template for the URL that should be opened. The
    string `{searchTerms}` will be replaced with the search terms.
-   `iconPath`: Path to the icon that should be displayed for the search engine.
    The icon may look blurry if it is smaller than 64px in height and width.

Configuration changes take effect when the extension is activated, so after
making changes it may be necessary to disable and re-enable the extension in
GNOME Tweak Tool or at <https://extensions.gnome.org/local>.

## Usage

When typing a query in GNOME’s activity view, the configured search engines will
be displayed. On activation, a results page opens in the default web
browser.

## Acknowledgements

As development documentation for GNOME Shell search providers is sparse, I have
based this extension on [Wikidata Search
Provider](https://github.com/bmansurov/wikidata-search-provider) by Bahodir
Mansurov.

## License

Web Search Provider for GNOME Shell  
Copyright (C) 2015, 2017 Contributors, Bahodir Mansurov
Copyright (C) 2017, 2018 Moritz Rakow

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
