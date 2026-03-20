<!DOCTYPE html>
<!--
cartovanta-web -- the web face of CartoVanta
Copyright (C) 2026  Sophia Elizabeth Shapira

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Oracle Reader</title>
  <style>
    #tarot-app .table {
      background-image: <?php
      echo('url("');
      echo(addslashes($loca_cloth));
      echo('")');
      ?> !important;
      background-size: cover !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
    }

    #cartovanta-legal-notice {
      margin: 1rem;
      padding: 0.75rem 1rem;
      border: 1px solid #888;
      background: #f8f8f8;
      font-size: 0.95rem;
      line-height: 1.4;
    }

    #cartovanta-legal-notice h2 {
      margin-top: 0;
      font-size: 1.05rem;
    }

    #cartovanta-legal-notice p {
      margin: 0.5rem 0;
    }
  </style>
</head>
<body>
  <div id="cartovanta-legal-notice">
    <h2>License and Source Notice</h2>
    <p>This page was generated using <em>cartovanta-web</em>, software for interfacing CartoVanta with the web.</p>
    <p><em>cartovanta-web</em> is free software: you may redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.</p>
    <p>CartoVanta is distributed without any warranty; without even the implied warranty of merchantability or fitness for a particular purpose.</p>
    <p><a href="https://github.com/CartoVanta/cartovanta-web.git">Get the CartoVanta source code</a></p>
    <p><a href="https://www.gnu.org/licenses/agpl-3.0.html">View the GNU Affero General Public License</a></p>
  </div>

  <?php
  echo('<div id="tarot-app" data-deck-url="');
  echo(addslashes($loca_decko));
  echo('/deck.json">');
  ?></div>
  <?php
  echo('<script src="');
  echo(addslashes($loca_jscrip));
  echo('"></script>');
  ?>
</body>
</html>