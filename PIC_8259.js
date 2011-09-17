/*  i8259 Programmable Interrupt Controller
    ---------------
    http://en.wikipedia.org/wiki/Intel_8259

    NOTE: this is coded to only support x86 mode (no MCS 80/85 mode)

    Supported: 
    ---------
    * Fully Nested Mode
    * Master Mode
    * ICW1, ICW2, ICW3, ICW4 (configuration set, IMR set)
    * OCW1, OCW2, OCW3 (configuration set, IRR/ISR read)
    * Specific and Non-specific EOIs
    * Automatic EOI
    * Special Masked Mode

    Not Supported:
    -----------
    * Special Fully Nested Mode
    * Slave Mode
    * Automatic Rotation
    * Specific Rotation
    * Poll Mode

    Needs more extensive testing!!
*/
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
    // TODO: Do nothing if not initialised?
    if (this.state != this.states.Ready)
        return;

    var mask = (1<<id);

    // Set the IRR bit
    this.registers.IRR |= mask;

    // TODO: Call an update?
}
PIC_8259.prototype.portWrite = function(port) {
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
                        singleMode: false, // no Slave in XT so this will be 1
                        // OCW3
                        specialMaskedMode: false,
                        pollMode: false
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
                                level = this.getHighestPriorityInterruptInService();
                                var mask = (1<<level);
                                // Note if in Special Mask Mode if IMR bit is set for the interrupt the ISR bit is not cleared (p15)
                                if (level !== false && !(this.config.specialMaskedMode && this.registers.IMR & mask)) {
                                    this.registers.ISR &= ~mask;
                                }
                                break;
                            case 2: break;// No operation
                            case 3: // Specific EOI Command
                                this.registers.ISR &= ~(1<<level);
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
                        $.log('PIC8259 : OCW2 : ' + byte);
                    } else {
                        // OCW3
                        switch (byte & 3) {
                            case 0, 1:
                                break;
                            case 2: // Read IRR
                                this.cpu.portDeviceWriteByte(Constants.Master8259CommandPort, this.registers.IRR);
                                $.log('PIC8259 : OCW3 : read IRR - ' +this.registers.IRR);
                                break;
                            case 3: // Read ISR
                                this.cpu.portDeviceWriteByte(Constants.Master8259CommandPort, this.registers.ISR);
                                $.log('PIC8259 : OCW3 : read ISR - ' +this.registers.ISR);
                                break;
                        }
                        // Is Polling mode possible in a PC?
                        if (byte & 4) {
                            this.config.pollMode = true; // poll command
                        } else {
                            this.config.pollMode = false; // no poll command
                        }
                        $.log('PIC8259 : OCW3 : poll mode ' + this.config.pollMode);

                        if (byte & 96) {
                            this.config.specialMaskedMode = true; // Set special mask
                        } else if (byte & 64) {
                            this.config.specialMaskedMode = false; // Reset special mask
                        }
                        $.log('PIC8259 : OCW3 : special masked mode ' + this.config.specialMaskedMode);
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
                $.log('PIC8259 : OCW1 : set interrupt mask (IMR) ' + byte);
                break;
            default:
                throw 'PIC8259 : Initialization Command Word or Operation Command Words received when not in valid state';
        }
    }
}
PIC_8259.prototype.getHighestPriorityInterruptInService = function() {
    var i = 0,
        interrupt = false;
    for (; i < 8; i++) {
        if (this.registers.ISR & (1<<i)) {
            interrupt = i;
            break;
        }
    }
    return interrupt;
}
PIC_8259.prototype.getHighestPriorityInterrupt = function() {
    var mask = false,
        interrupt = false,
        i = 0;
    if (!this.config.specialFullyNestedMode) {
        // Fully Nested Mode (default mode) : int 0 highest priority -> int 7 lowest
        if (!this.config.specialMaskedMode) {
            var higherinservice = false;
            for (; i < 8; i++) {
                higherinservice = mask ? (this.registers.ISR & mask) : false;
                mask = (1<<i);
                if (!higherinservice) {
                    if (this.registers.IRR & mask) {
                        interrupt = i;
                        break;
                    }
                } else {
                    $.log('PIC8259 : Higher Interrupt already in service!')
                    break;
                }
            }
        } else {
            // Special Masked Mode
            // Allow all interrupts not masked, by-passes the normal requirement that
            // lower priority interrupts are inhibited while servicing a routine.
            for (; i < 8; i++) {
                if (this.registers.IRR & mask) {
                    interrupt = i;
                    break;
                }
            }
        }
    } else {
        throw 'PIC8259 : Special Fully Nested Mode is not supported!';
    }
    return interrupt;
}



test = 0;
PIC_8259.prototype.update = function() {
    // Get some processing time
    $.log('PIC8259 : UPDATE : tick');
    //  *************** TEST :::: Interrupt needs servicing
    if (test == 0) {
        this.interruptRequest(5);
    } else if (test == 1) {
        this.interruptRequest(0);
    }
    test++;
    // ************************

    // If new interrupts exist
    if (this.registers.IRR != 0) {
        // Send INT to CPU (see INTERRUPT SEQUENCE in 8259A docs)
        // Fire highest priority int
        var interrupt = this.getHighestPriorityInterrupt(),
            highestprioritymask = (1<<interrupt);
        if (highestprioritymask !== false && (this.registers.IMR & highestprioritymask)) {    
            // Check INTA (ie set INT bit high and check response from CPU)
            if (this.cpu.acceptingInterrupts()) {
                this.registers.ISR |= highestprioritymask;  // Set ISR
                this.registers.IRR &= ~highestprioritymask; // Clear IRR

                $.log('PIC8259 : interrupt ' + interrupt + ' is enabled (as per IMR).')

                // Now send the interrupt ID (vector) to the CPU
                this.cpu.hardwareInterruptRequest(this.config.addressVector + interrupt);

                // In AEOI mode we reset ISR bit here else it is reset by an EOI command at the end of the int service routine
                if (this.config.autoEndOfInterruptMode) {
                    this.registers.ISR ^= highestprioritymask; // Reset bit
                }
            } else {
                $.log('PIC8259 : interrupt ' + interrupt + ' is not masked but CPU did not acknowledge int.');
            }
        } else {
            $.log('PIC8259 : interrupt ' + interrupt + ' is masked or higher interrupt already in service.');
        }
    }
}
