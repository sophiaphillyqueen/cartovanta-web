#!/usr/bin/env perl
# cartovanta-web - Web face for the CartoVanta card system
# Copyright (C) 2026  Sophia Elizabeth Shapira
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
use strict;

my $hme;
my $destd;

$hme = $ENV{'HOME'};
if ( $hme eq '' )
{
  $hme = `( cd && pwd )`;
  chomp($hme);
}
$destd = $hme . '/local/cartovanta-bin';

sub grp_install {
  my $lc_dsts;
  my $lc_cmd;
  $lc_dsts = $destd . '/' . $_[0] . '-exe';
  system('mkdir','-p',$destd);
  if ( -d $lc_dsts )
  {
    die("\nThere should be no dir at:\n  " . $lc_dsts . "\n\n");
  }
  #system('cp',($_[0] . '-exe.pl'),$lc_dsts);
  $lc_cmd = "cat " . &shell_quote(($_[0] . '-exe.pl')) . " > " . &shell_quote($lc_dsts);
  #system('echo',$lc_cmd);
  system($lc_cmd);
  system('chmod','755',$lc_dsts);
  system('cp','-r',($_[0] . '-res'),($destd . '/.'));
}
sub shell_quote {
  my $lc_strg;
  ($lc_strg) = @_;
  return "''" if !defined($lc_strg) || $lc_strg eq '';
  $lc_strg =~ s/'/'"'"'/g;
  return "'$lc_strg'";
}

&grp_install('web-jsout');
&grp_install('web-htout');
