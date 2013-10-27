#! /usr/bin/perl

use 5.012;
use strict;
use warnings;

sub genInputXmls{
	my $ar = shift or die "no paramters.\n";
	my $r = [];
	for(@{$ar}){
		push @$r,"$_.xml";
	}
	$r;
}

my $js = 'xmltoc.js';
my @input = qw/character 
equipment 
skill 
chapter 
stage
chrexp
chrfuseexp
player_exp
/;

my $xmls = genInputXmls \@input;
my @gens;
print "Building ...\n";

for(@input){
	my $cmd = "node $js -i=$_";
	my @a = `$cmd`;
	print @a,"\n";
	die if $?;

	for(@a){
		chomp;
	}
	push @gens,@a
}

#TODO: modify the path you need

my $cnt = 0;
my $target_d = "$ENV{HOME}/mrepos/HotChip/HotChip/Classes/xml/gen";
die "$target_d is not a directory.\n" if not -e $target_d or -f $target_d;

for(@gens){
	my $cmd = "cp -v $_ $target_d";
	system($cmd);
	die if $?;
	$cnt++;
}
print "$cnt .h/.cpp/.c source file(s) updated.\n";
print "\n";

$cnt = 0;
my $xml_d = "$ENV{HOME}/mrepos/HotChip/HotChip/Resources/Release/xmls";
die "$xml_d is not a folder.\n" if not -e $xml_d or -f $xml_d;

for(@$xmls){
	my $cmd = "cp -v $_ $xml_d";
	system($cmd);
	die if $?;
	$cnt++;
}
print "$cnt xml file(s) updated.\n";
print "\n";

print "Done.\n";




