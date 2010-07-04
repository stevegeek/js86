
JSEmu.Devices.i8259 = JSEmu.Devices.Generic.extend({
    init : function ()
    {
    }
    
});

JSEmu.Devices.i8259Master = JSEmu.Devices.i8259.extend({
    init : function (theCPU)
    {
        this.systemCPU = theCPU;
        
        this.systemCPU.registerIODevicePort(0x20); // command 
        this.systemCPU.registerIODevicePort(0x21); // data
    }
    
});

JSEmu.Devices.i8259Slave = JSEmu.Devices.i8259.extend({
    init : function (theCPU)
    {
        this.systemCPU = theCPU;
        
        this.systemCPU.registerIODevicePort(0xA0); // command
        this.systemCPU.registerIODevicePort(0xA1); // data
    }
    
});
