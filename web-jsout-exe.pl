#!/usr/bin/env perl
# cartovanta web-jsout -- Output JavaScript for card readings
# Copyright (C) 2026  Sophia Elizabeth Shapira
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
use strict;
use Cwd 'abs_path';
use File::Basename qw(dirname);

my $resloc; # Location of Resource Directory
#my $counto; # Number of arguments

$resloc = dirname(abs_path(${0})) . '/web-jsout-res';

exec('cat',($resloc . '/cartovanta-web-reader.js'));
