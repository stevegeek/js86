Javascript IBM PC Model 5150 emulator. 
--------------------------------------

This is a project I started some time ago but didn't have much time to work on recently. 

With the release of the awesome [jslinux](http://bellard.org/jslinux/tech.html) by Fabrice Bellard I thought people might like something to look at and play with, eventhough its very early. 

I was just starting to make everything jQuery based, and wanted to move all the web-worker handling code over to JQuery.Hive as it is cool. 

There is a new branch called 'new' which includes the very start of a new cleaner javascript implementation that I may eventually go for. 

To see it run a simple binary
-----------------------------
Open 'index.html' in your modern browser. 

Compile binaries with NASM, however if you look in CPU.js you will see only a couple of supported instructions, hadnt got round to adding more yet!
There is a test assembly source file in Tests/

MIT License
-----------

Copyright (C) 2010,2011 by Stephen Ierodiaconou

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN

