
JSEmu.Devices.i8259 = JSEmu.Devices.Generic.extend({
    init : function ()
    {
    }

});

JSEmu.Devices.i8259Master = JSEmu.Devices.i8259.extend({
    init : function (theCPU)
    {
        /*this.systemCPU = theCPU;

        this.systemCPU.registerIODevicePort(this, 0x20); // command
        this.systemCPU.registerIODevicePort(this, 0x21); // data
        */
    },


    receiveByte: function ()
    {
        // process it
    },

    receiveWord: function ()
    {

    },

    sendByte: function ()
    {
        //this.systemCPU
    },

    sendWord: function ()
    {

    },

});

JSEmu.Devices.i8259Slave = JSEmu.Devices.i8259.extend({
    init : function (theCPU)
    {
        this.systemCPU = theCPU;

        this.systemCPU.registerIODevicePort(this, 0xA0); // command
        this.systemCPU.registerIODevicePort(this, 0xA1); // data
    }

});
