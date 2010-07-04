
importScripts(  'SimpleJavascriptInheritance.js', 'JSEmu.js', 
                'Memory.js', 'CPU.js', 'ROM.js',
                'PIC.js', 'PIT.js');

/* In first IBM PCs this is where the ROM resided that contained the BIOS and a BASIC interpreter,
 however in later machines the ROM exists at the end of the addressable space and then the BIOS
 is loaded into this location in memory. The CPU starts using the address located at the very end
 of the addressable space.
 
 Memory Map: http://www.elecnet.chandra.ac.th/learn/tipntrick/xt/default.htm
*/

JSEmu.IBMPC = JSEmu.Devices.Generic.extend(
{
    // Webworker message processor
    processWorkerMessage: function(message)
    {
        // message to start, stop, pause
        // set , read bytes
        // pass binary file name to load for ram/rom
        try
        {
            //JSEmu.logToConnectedScriptWithID(message.fromScriptID, 'HELLO');
            switch(message.type)
            {
                case "powerUp":
                    break;
                case "powerUpAndRun":
                    JSEmu.respondToWatcherWithID(message.fromScriptID, message.id, 'sys:ack', 'powerUpAndRun');
                    this.powerUp();
                    if (!this.run())
                    {
                        JSEmu.messageWatcherWithID(message.fromScriptID, 'sys:hlt', 'The system halted.');
                    }
                    break;
                case "powerDown":
                    break;
                case "getRegisterFile":
                    break;
                case "setRAMContentsWithString":
                    this.setRAMContentsWithString(message.data);
                    break;

                case "loadBinaryFromURLIntoRam":
                    var bindata = this.loadBinaryFromURL(message.data.binaryURL);
                    this.setRAMContentsWithString({string: bindata,
                                        startAddress:message.data.startAddress
                                        });
                    JSEmu.respondToWatcherWithID(message.fromScriptID, message.id, 'sys:ack', 'loadBinaryFromURLIntoRam');
                    break;
                default:
                    JSEmu.logToConnectedScriptWithID(message.fromScriptID, 'Invalid message sent to IBMPC XT', 'error');
            }
        }
        catch (e)
        {
            JSEmu.logToConnectedScriptWithID(message.fromScriptID, 'IBMPC unhandled Exception. Error name: ' + e.name + '. Error message: ' + e.message, 'fatal');
        }
    },
    
    init: function ()
    {
        this.on = false;
        this.devices = new Array(); // <- devices will live on seperate workers prob

        // memory, rom and cpu all live in this worker
        this.mem = new JSEmu.Devices.Memory(new JSEmu.MemoryRange(JSEmu.IBMPC.RAMSize, 0));
        this.rom = new JSEmu.Devices.ROM();
    
        this.cpu = new JSEmu.Devices.i8086(this.mem);
        
        this.pic_master = new JSEmu.Devices.i8259Master(this.cpu);
        this.pic_slave = new JSEmu.Devices.i8259Slave(this.cpu);
        
        this.vgaWorker = {};//new Worker('VGA.js');        
    
        this.singleStep = false;
    },
    
    loadBinaryFromURL: function(url)
    {
        //JSEmu.logToConnectedScripts('Loading binary file : ' + url);
        // Fill the RAM with this file
        // Code from https://developer.mozilla.org/En/Using_XMLHttpRequest#Receiving_binary_data
        var req = new XMLHttpRequest();
        req.open('GET', url, false);
        // The following line says we want to receive data as Binary and not as Unicode
        req.overrideMimeType('text/plain; charset=x-user-defined');
        req.send(null);
        return req.responseText;
    },
    
    setRAMContentsWithString: function(data)
    {        
        //JSEmu.logToConnectedScripts('data.count '+ data.count + ' ' + (('count' in data) ? (data.count) : (data.string.length)));
        this.mem.writeBytesFromString(data.string, new JSEmu.MemoryRange( 
                                (('count' in data) ? (data.count) : (data.string.length)),
                                (('startAddress' in data) ? (data.startAddress) : 0)
                                ));
    },

    setRAMContentsWithArray: function(data)
    {
        this.mem.writeBytes(data.array, new JSEmu.MemoryRange( 
                                (('count' in data) ? (data.count) : (data.array.length)),
                                (('startAddress' in data) ? (data.startAddress) : 0)
                                ));
    },
    
    //this.setROMContents = function(data)
    //{
    //    rom.setContents(data);
    //}
    
    run: function()
    {
        //JSEmu.logToConnectedScripts('Run');
        var i = 0;
        while (this.performCycle() && !this.singleStep)
        {
            i++;
            if ( i > 1000 )
            {
                JSEmu.logToConnectedScripts('DEBUG*****: 1000 cycles complete, DIEING');
                break;
            }
        }
        
        if (this.cpu.isHalted())
            return false;
        else
            return true;
    },

    performCycle: function()
    {
        if (!this.on)
            return false;        
        
        this.cpu.fetchAndExecute();
        
        var i = 0,
            count = this.devices.length;
        for (; i < count; i++)
            this.devices[i].performCycle();

        return !this.cpu.isHalted();
    },

    reset: function()
    {
        var i = 0,
            count = this.devices.length;
        this.cpu.reset();
        this.mem.reset();
        this.rom.reset();
        for (; i < count; i++)
            this.devices[i].reset();

        return this._super();
    },

    powerUp: function()
    {
        //JSEmu.logToConnectedScripts('IBMPC: Power Up');
        this.on = true;
        // send powerDown to everything
        var i = 0,
            count = this.devices.length;
        this.cpu.powerUp();
        this.mem.powerUp();
        this.rom.powerUp();
        for (; i < count; i++)
            this.devices[i].powerUp();
            
        return this._super();
    },

    powerDown: function()
    {
        JSEmu.logToConnectedScripts('IBMPC: Power Down. '); //Approx cycles if simulated: ' + [cpu cycleCount] + ' (sim time: ' + ([cpu cycleCount]/IBMPCCPUFrequency) + 's)');
        this.on = false;
        // send powerDown to everything
        var i = 0,
            count = this.devices.length;
        this.cpu.powerDown();
        this.mem.powerDown();
        this.rom.powerDown();
        for (; i < count; i++)
            this.devices[i].powerDown();
        
        return this._super();
    }
});

PC = null;

// Script has connected to us
onconnect = function (event) 
{
    var port = event.ports[0];
        
    JSEmu.connectedScripts.push(port);
    JSEmu.messageWatcherWithID(JSEmu.connectedScriptID, 'sys:connid', ''+JSEmu.connectedScriptID);    
    JSEmu.connectedScriptID++;
    
    if (!PC)
        PC = new JSEmu.IBMPC();
    
    port.onmessage = function (event)
    {
        PC.processWorkerMessage(event.data);
    }
}
