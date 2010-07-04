
// Its a flat memory with a linear address space
JSEmu.Devices.Memory = JSEmu.Devices.Generic.extend({
    
    init: function (/*JSEmu.MemoryRange*/ range ) 
    {
        this.size = range;
        
        JSEmu.logToConnectedScripts('MEMORY : Requesting ' + this.size.count + ' bytes');

        try 
        {
            this.bytes = Array(this.size.count);
        }
        catch(e)
        {
            JSEmu.logToConnectedScripts('MEMORY : Could not allocate this much RAM! ' + this.bytes.length + ' bytes')
        }

        JSEmu.logToConnectedScripts('MEMORY : Got ' + this.bytes.length + ' bytes');
    },
    
    readByteAt: function (address)
    {
        JSEmu.logToConnectedScripts('MEMORY : Read ' + address + '('+this.bytes.length+') ' +  this.bytes[address])
        // this.debugDumpParagraphTolog(address);
        // FIXME: WHAT HAPPENS WITH OUT OF RANGE?
        // wrap around I suppose
        return this.bytes[address];
    },
    
    readWordAt: function (address)
    {
        return (this.bytes[address] + (this.bytes[address + 1] << 8));
    },
    
    writeBytes: function (data, range)
    {
        // TEST RANGE RETURN FALSE IF OUT?
        var i = 0;

        // FIXME: NOT LOOPS
        for (; i < range.count; i++)
            this.bytes[range.startAddress + i] = data[i]; 

        //this.debugDumpBytesTolog(range);
        return true;
    },
    
    writeBytesFromString: function(string, range) 
    {
        JSEmu.logToConnectedScripts('MEMORY : write ' + range.count + ' bytes');
        // TEST RANGE RETURN FALSE IF OUT?
        var i = 0;

        // FIXME: NOT LOOPS
        for (; i < range.count; i++)
            this.bytes[range.startAddress + i] = string.charCodeAt(i) & 0xFF; 

        //[self debugDumpBytesTolog:range];
        return true;
    },
    
    debugDumpParagraphTolog: function (address)
    {
        var string = "MEMORY: PARA(" +address + ") : ";
        for (var i = 0; i < 16; i++)
            string += this.bytes[address+i] + ",";
        JSEmu.logToConnectedScripts(string);
    },

    debugDumpBytesTolog: function (range)
    {
        var string = "MEMORY: BYTES(" + range.startAddress + "," + range.count + " ) : ";
        for (var i = 0; i < range.count; i++)
            string += this.bytes[range.startAddress + i] + ",";
        JSEmu.logToConnectedScripts(string);  
    }
});

