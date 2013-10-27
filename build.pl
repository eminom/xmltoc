#! /usr/bin/perl
# Authored by eminem(eminom@github.com)
# This script contains the builds process from XML to C structure.
# Step 1. Generate the .h/.cpp files from XML  (basic function)
# Step 2. Copy gen files to destination (for the project which need them)
# Step 3. Copy XMl files to destination (optional)

use 5.010;
use strict;
use warnings;

my $platform_mv;
sub config{
	if ( $^O =~ /Win/i ){
		$platform_mv = 'move';
	} else {
		$platform_mv = 'mv';
	}
}

sub doGens{
	my $input = shift or die "no inputs";
	my $js = 'xmltoc.js';

	my $gendir = "./.gen";
	mkdir $gendir;
	die "$gendir is not a directory and cannot be created." if not -d $gendir;
	my @gens;
	print "Building ...\n";

	for(@$input){
		$_ = $_ . '.xml' if not /\.xml$/ixs;
		my $cmd = "node $js -i=$_";
		my @a = `$cmd`;
		#print @a,"\n";
		die if $?;
		for(@a){
			chomp;
			my $mv = "$platform_mv $_ $gendir";
			`$mv`;
			die "move $_ failed" if $?;
			$_ = "$gendir/$_";
		}
		push @gens,@a
	}
	@gens;
}

#TODO: modify the path you need
sub doCopyGens{
	my $gens = shift or die "no gens for me";
	my $target_d = shift or die "no target path for me";
	my $cnt = 0;
	die "$target_d is not a directory.\n" if not -d $target_d;

	for(@$gens){
		my $cmd = "cp -v $_ $target_d";
		system($cmd);
		die if $?;
		$cnt++;
	}
	print "$cnt .h/.cpp/.c source file(s) updated.\n";
	print "\n";
}

sub doCopyXmls{
	my $xmls = shift or die "no xmls specified";
	my $xml_d = shift or die "need xml path specified";
	my $cnt = 0;

	#
	die "$xml_d is not a folder.\n" if not -e $xml_d or -f $xml_d;
	for(@$xmls){
		my $cmd = "cp -v $_ $xml_d";
		system($cmd);
		die if $?;
		$cnt++;
	}
	print "$cnt xml file(s) updated.\n";
	print "\n";
}

sub main{
	# Configurable:
	my @inputs = qw{
			samples/character 
			samples/equipment 
			samples/skill 
			samples/chapter 
			samples/stage
			samples/chrexp
			samples/chrfuseexp.xml
			samples/player_exp.xml
	};
	my @gens = doGens \@inputs;
	doCopyGens \@gens, "$ENV{HOME}/mrepos/HotChip/HotChip/Classes/xml/gen";
	doCopyXmls \@inputs, "$ENV{HOME}/mrepos/HotChip/HotChip/Resources/Release/xmls";
}

# Ground zero:>>
config;
main;
print "\ndone\n";




