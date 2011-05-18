Javascript IBM PC AT emulator. 
------------------------------

This is a project I started some time ago but didn't have much time to work on recently. 

With the release of the awesome [jslinux](http://bellard.org/jslinux/tech.html) by Fabrice Bellard I thought people might like something to look at and play with, eventhough its very early. 

I was just starting to make everything jQuery based, and wanted to move all the web-worker handling code over to JQuery.Hive as it is cool. 

There is a new branch called 'new' which includes the very start of a new cleaner javascript implementation that I may eventually go for. 

To see it run a simple binary
-----------------------------
Open 'index.html' in your modern browser. 

Compile binaries with NASM, however if you look in CPU.js you will see only a couple of supported instructions, hadnt got round to adding more yet!
There is a test assembly source file in Tests/
