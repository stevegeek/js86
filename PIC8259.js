// 8259 Programmable Interrupt Controller
// http://en.wikipedia.org/wiki/Intel_8259
// ************************************************************************
function PIC_8259(cpu) {
    this.states = {
        Uninitialised: 0,
        WaitingForICW2: 1,
        WaitingForICW3: 2,
        WaitingForICW4: 3,
        Ready: 4
    }
    this.state = this.states.Uninitialised;
    this.cpu = cpu;

    this.cpu.addPortDevice(Constants.Master8259CommandPort, this);
    this.cpu.addPortDevice(Constants.Master8259DataPort, this);

    this.registers = {
        IMR: 0,
        ISR: 0,
        IRR: 0
    }
}
PIC_8259.prototype.interruptRequest = function(id) {
    // fire interrupt with id, 8 for the master , or 15 with master/slave
    //this.registers.IRR[id] = true;

    // TODO: Do nothing if not initialised?
    if (this.state != this.states.Ready)
        return;

    // TODO: check priority/mask etc

    this.cpu.interruptRequest(id);
}
PIC_8259.prototype.portWrite = function(port) {
    // TODO: Here we could cause an update too, thus servicing an interripts at this point too.
    var byte = this.cpu.portReadByte(port);
    $.log('PIC8259 : PORTS : saw port write ' + port + ' val ' + byte)
    // The low bit of the port number sets the A0 bit of the command words. This is cause in the
    // hardware the CPU address bus bit A1 is connected to A0 on the 8259 and when the port address
    // is written to the address bus it modifies this bit
    // Process ICWs and OCWs
    if (port == Constants.Master8259CommandPort) {  // A0 pin is 0
        // If D4 is 1 then we have a Initialization Command Word 1 (ICW1)
        if (byte & 16) {
            switch (this.state) {
                case this.states.Uninitialised: // ready for ICW1
                    this.registers.IMR = 0;
                    // initial conditions
                    this.config = {
                        //ICW1
                        requireICW4: false,
                        //callAddressInterval: 0, ignored in 8086 mode
                        triggerMode: false,
                        lowestPriority: 7,
                        //ICW2
                        addressVector: 0x0,
                        //ICW4
                        mode86: false,
                        autoEndOfInterruptMode: false,
                        bufferedMode: false,
                        specialFullyNestedMode: false,
                        singleMode: false // no Slave in XT so this will be 1
                    }
                    this.config.requireICW4 = byte & 1 ? true : false;
                    this.config.singleMode = byte & 2 ? true : false;
                    this.config.triggerMode = byte & 8 ? true : false;
                    $.log('PIC8259 : ICW1 : icw4 ' + this.config.requireICW4 + ' sgl ' + this.config.singleMode + ' trgr ' + this.config.triggerMode);
                    this.state = this.states.WaitingForICW2;
                    break;
                default:
                    throw 'PIC8259 : ICW1 received in incorrect state';
            }
        } else {
            // an OCW2 or 3
            switch (this.state) {
                case this.states.Ready:
                    if (!(byte & 8)) { // bit 3 determines command
                        // OCW2
                        var level = byte & 7, // Bottom 3 bits are the interrupt level if needed
                            mode = byte & 0xE0 >> 5;
                        switch (mode) {
                            case 0: // Rotate in automatic EOI mode (CLEAR)
                                break;
                            case 1: // Non-specific EOI Command
                                break;
                            case 2: // No operation
                                break;
                            case 3: // Specific EOI Command
                                break;
                            case 4: // Rotate in automatic EOI mode (SET)
                                break;
                            case 5: // Rotate on non-specific EOI command
                                break;
                            case 6: // Set priority command
                                break;
                            case 7: // Rotate on specific EOI command
                                break;
                        }
                    } else {
                        // OCW3
                    }
                    break;
                default:
                    throw 'PIC8259 : Operation Command Words received when not in Ready state';
            }
        }
    } else { // A0 is 1
        // Port is Constants.Master8259DataPort
        switch (this.state) {
            case this.states.WaitingForICW2: // Ready for ICW2
                this.config.addressVector = byte & 0xF8; // top 5 bits of ICW2
                $.log('PIC8259 : ICW2 : vec ' + this.config.addressVector);
                // See 8259 Datasheet page 10, Figure 6 Initialization Sequence
                if (this.config.singleMode && !this.config.requireICW4)
                    this.state = this.states.Ready; // ready
                else if (!this.config.singleMode)
                    throw 'PIC8259 : no slave device support'; //this.state = this.states.WaitingForICW3; // wait for icw3 -- on when there is a slave
                else if (this.config.singleMode && this.config.requireICW4)
                    this.state = this.states.WaitingForICW4; // wait for icw4
                else
                    throw 'PIC8259 : Internal state invalid on receipt of ICW2.';
                break;
            case this.states.WaitingForICW4:
                this.config.mode86 = byte & 1 ? true : false;
                this.config.autoEndOfInterruptMode = byte & 2 ? true : false;
                this.config.bufferedMode = byte & 8 ? true : false;
                // TODO: if you add Slave support must add the parsing of the bit 3 which is master or slave buffered.
                this.config.specialFullyNestedMode = byte & 16 ? true : false;
                $.log('PIC8259 : ICW4 : 86mode ' + this.config.mode86 + ' autoEOI ' + this.config.autoEndOfInterruptMode + ' buffered ' + this.config.bufferedMode + ' fullyNested ' + this.config.specialFullyNestedMode);
                this.state = this.states.Ready;
                break;
            case this.states.Ready:
                // Accept as an OCW1 - the interrupt mask
                this.registers.IMR = byte;
                break;
            default:
                throw 'PIC8259 : Initialization Command Word or Operation Command Words received when not in valid state';
        }
    }
}
PIC_8259.prototype.update = function() {
    // Get some processing time
    $.log('PIC8259 : UPDATE : tick');

    // STUFF

    // TEST :::: Interrupt needs servicing
    var data = 1;
    this.cpu.interruptRequest(data);
}