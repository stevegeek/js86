
// Emulator singleton
var Emulator = {
    init: function() {
    },
    loadBinaryFileAndRun: function (fileName, emuCallback) {
    }
}

$(function() {
    var terminal = {
        // Parameters + defaults
        maxCharacters:  80,
        lines:          new Array(25),
        terminalID:     '#terminal',
        // State
        startLine:      0,
        curLine:        0,
        needsUpdate:    false,
        isFull:         false,
        cursorState:    false,
        // Methods
        init: function(idName, interval, blinkInterval) {
            this.refreshInterval        = typeof interval == 'undefined' ? 20 : interval;
            this.blinkCursorInterval    = typeof blinkInterval == 'undefined' ? 500 : blinkInterval;
            this.$domElement             = $(typeof idName == 'undefined' ? this.terminalID : idName);

            // For timer callbacks bind with this object
            var self = this;
            window.setInterval(function(){self.refresh.apply(self)}, this.refreshInterval);
            window.setInterval(function(){self.blinkCursor.apply(self)}, this.blinkCursorInterval);

            var i = this.lines.length;
            for (; i--;)
                this.lines[i] = '';
            return this;
        },
        // Refresh the screen, takes the
        refresh: function() {
            if (!this.needsUpdate)
                return;

            this.needsUpdate = false;
            var terminalText = '',
                count = this.lines.length,
                startLine = this.isFull ? this.curLine + 1 : 0;
            for (var i=0; i < count; i++) {
                // Start drawing from current line in cyclic buffer
                var line = this.lines[(i+startLine >= count) ? i+startLine-count : i+startLine];
                // If one current line, blink the cursor with an underline
                if (((!this.isFull && i == this.curLine) || (this.isFull && i == count-1)) && line.length < this.maxCharacters-1)
                    line += (this.cursorState ? '<u>&nbsp;</u>' : '');
                terminalText += line + '<br>';
            }
            this.$domElement.html(terminalText);
        },
        // Change state of cursor
        blinkCursor: function() {
            this.needsUpdate = true;
            this.cursorState = !this.cursorState;
        },
        // Insert new line
        newLine: function() {
            var count = this.lines.length;
            if (++this.curLine >= count) {
                this.isFull = true;
                this.curLine = 0;
            }
            this.lines[this.curLine] = '';
            return this;
        },
        // Write some raw text to the screen
        write: function(msg) {
            if (msg.length > 0)
                this.needsUpdate = true;

            // Split message into lines
            while (msg.length + this.lines[this.curLine].length > this.maxCharacters) {
                var preLength = this.maxCharacters - this.lines[this.curLine].length;
                this.lines[this.curLine] += msg.substring(0, preLength);
                msg = msg.substring(preLength);
                this.newLine();
            }
            this.lines[this.curLine] += msg;

            return this;
        },
        // TODO: printf-like
        log: function(msg) {
            // TODO: Parse varargs
            // Handle special
            // Split message into lines
            // Newlines
            var messageLines = msg.split('\n');
            for (var i = 0; i < messageLines.length; i++) {
                if (i > 0)
                    this.newLine();
                this.write(messageLines[i]);
            }
            return this;
        }
    };

    // For debugging purposes we create a simulated 80x25 'text mode'. This
    // however does not obviously emulate any of the VGA subsystem which will
    // hopefully replace to (and the screen will become a canvas element).
    terminal.init();

    var pcWorker;
    // Create Main worker
    $.Hive.create({
        worker: 'IBMPC.js',
        receive: function(data) { // Parse messages from workers
            switch (data.name) {
                case 'ack':
                    switch (data.request.name) {
                        case 'loadBinaryAndSetAsRAM':
                            console.log('rom loaded')
                            pcWorker.send({
                                name: 'doSystemCycle',
                                data: 500
                            });
                            break;
                        case 'doSystemCycle':
                            console.log('a cycle completed');
                            break;
                    }
                    break;
                default:
                    console.log(data.message)
                    terminal.log(data.message)
            }
        },
        created: function($hive) {
            pcWorker = $( $hive );
            pcWorker.send( {
                    name: 'loadBinaryAndSetAsRAM',
                    data: 'ROM/rom.bin'
                }
            );
        }
    });
});
