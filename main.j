/*
 * AppController.j
 * js8086emu
 *
 * Created by You on June 18, 2010.
 * Copyright 2010, Your Company All rights reserved.
 */

@import <Foundation/Foundation.j>
//@import <AppKit/AppKit.j>

//@import "AppController.j"


@implementation GenericDevice : CPObject
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

- (void)reset
{
}

- (void)powerDown
{
}

@end

// A flat memory attached to a linear address bus
@implementation Memory : GenericDevice
{
    CPArray bytes;
    unsigned size;
    unsigned startAddress;   //@accessors(readonly);
}

- (id)init
{
    if(self = [super init])
    {
        bytes = [];
        size = 0;
        lowStartAddress = 0;
    }
    return self;
}

- (id)initWithRange:(CPRange)range
{
    self = [self execute_init];
    size = range.length;
    lowStartAddress = range.location;
}

@end


@implementation CPU : GenericDevice
{    
    Memory mem;
    int cycleCount; // Used to compute emulated cycles Per second say
}

- (id)initWithMemory:(RAM)theRAM
{
    if(self = [super init])
    {
        mem = theRAM;
    }
    return self;
}

@end


@implementation MemoryMappedDevice : GenericDevice
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

@implementation Storage : MemoryMappedDevice
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

@implementation ROM : Storage
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

@implementation PIT : MemoryMappedDevice
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

@implementation PIC : MemoryMappedDevice
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

@implementation BIOS : ROM
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

/*
i8086/8088 CPUs
---------------
http://pdf1.alldatasheet.com/datasheet-pdf/view/66062/INTEL/8088.html

CPU Memory map
0xFFFFF 
RESET BOOTSTRAP PROGRAM JUMP
0xFFFF0   <- CPU resets to here

0x003FF
INTERRUPT POINTER (type 255)
0x003F0

0x00007F
INTERRUPT POINTER (type 1)
0x00004
0x00003
INTERRUPT POINTER (type 0)
0x00000
*/
var i8086ResetVectorAddress = 1048560; //0xFFFF0 (FFFF:0)

/* ModRM */
function i8086ModRMMake(/*byte*/ modrm)
{
    return {};
}

@implementation i8086 : CPU
{
    short ax;
    short bx;
    short cx;
    short dx;
    
    short si;
    short di;
    
    short sp;
    short bp;
    
    short ip;
    
    short cs;
    short ds;
    short ss;
    short es;
    
    short flag;
    

}

- (void)fetchAndExecute 
{
    [self execute_decodeAndExecute:[self execute_fetch]];
}

- (word)fetch
{
    var b = [mem readByteAt:ip];
    ip++;
    return b;
}

/*  See: http://www.mlsite.net/8086/   (an Excellent reference for this processor)
         http://developer.intel.com/design/PentiumII/manuals/24319102.pdf
         http://www.swansontec.com/sintel.html  (For an intro into what all this info means)
         http://ref.x86asm.net/geek.html 
         
    This is obviously not a cycle accurate simulation. The methods which actually execute can perform
    fetches with no time penalty.
*/
- (void)decodeAndExecute:(byte)instruction
{
    // test for primary opcode

    // Each Methods implementation has a description in the form
    /* OPCODENAME dest, src
    bytes - cycles
    flagsaffected */
    
    // Decode
    switch(instruction)
    {
        // High nibble 
        //0x0
        case 000: [self execute_addEbGb]; break;
        case 001: [self execute_addEvGv]; break;
        case 002: [self execute_addGbEb]; break;
        case 003: [self execute_addGvEv]; break;
        case 004: [self execute_addALIb]; break;
        case 005: [self execute_addAXIv]; break;
        case 006: [self execute_addPushES]; break;
        case 007: [self execute_popES]; break;
        case 008: [self execute_orEbGb]; break;
        case 009: [self execute_orEvGv]; break;
        case 010: [self execute_orGbEb]; break;
        case 011: [self execute_orGvEv]; break;
        case 012: [self execute_orALIb]; break;
        case 013: [self execute_orAXIv]; break;
        case 014: [self execute_pushCS]; break;
        case 015: [self invalidOpcodeException]; break;
        //0x1
        case 016: [self execute_adcEbGb]; break;
        case 017: [self execute_adcEvGv]; break;
        case 018: [self execute_adcGbEb]; break;
        case 019: [self execute_adcGvEv]; break;
        case 020: [self execute_adcALIb]; break;
        case 021: [self execute_adcAXIv]; break;
        case 022: [self execute_pushSS]; break;
        case 023: [self execute_popSS]; break;
        case 024: [self execute_sbbEbGb]; break;
        case 025: [self execute_sbbEvGv]; break;
        case 026: [self execute_sbbGbEb]; break;
        case 027: [self execute_sbbGvEv]; break;
        case 028: [self execute_sbbALIb]; break;
        case 029: [self execute_sbbAXIv]; break;
        case 030: [self execute_pushDS]; break;
        case 031: [self execute_popDS]; break;
        //0x2
        case 032: [self execute_andEbGb]; break;
        case 033: [self execute_andEvGv]; break;
        case 034: [self execute_andGbEb]; break;
        case 035: [self execute_andGvEv]; break;
        case 036: [self execute_andALIb]; break;
        case 037: [self execute_andAXIv]; break;
/* P */ case 038: [self execute_prefixES]; break; 
        case 039: [self execute_DAA]; break;
        case 040: [self execute_subEbGb]; break;
        case 041: [self execute_subEvGv]; break;
        case 042: [self execute_subGbEb]; break;
        case 043: [self execute_subGvEv]; break;
        case 044: [self execute_subALIb]; break;
        case 045: [self execute_subAXIv]; break;
/* P */ case 046: [self execute_prefixCS]; break; 
        case 047: [self execute_DAS]; break;
        //0x3
        case 048: [self execute_xorEbGb]; break;
        case 049: [self execute_xorEvGv]; break;
        case 050: [self execute_xorGbEb]; break;
        case 051: [self execute_xorGvEv]; break;
        case 052: [self execute_xorALIb]; break;
        case 053: [self execute_xorAXIv]; break;
/* P */ case 054: [self execute_prefixSS]; break;
        case 055: [self execute_AAA]; break;
        case 056: [self execute_cmpEbGb]; break;
        case 057: [self execute_cmpEvGv]; break;
        case 058: [self execute_cmpGbEb]; break;
        case 059: [self execute_cmpGvEv]; break;
        case 060: [self execute_cmpALIb]; break;
        case 061: [self execute_cmpAXIv]; break;
/* P */ case 062: [self execute_prefixDS]; break;
        case 063: [self execute_AAS]; break;
        //0x4
        case 064: [self execute_incAX]; break;
        case 065: [self execute_incCX]; break;
        case 066: [self execute_incDX]; break;
        case 067: [self execute_incBX]; break;
        case 068: [self execute_incSP]; break;
        case 069: [self execute_incBP]; break;
        case 070: [self execute_incSI]; break;
        case 071: [self execute_incDI]; break;
        case 072: [self execute_decAX]; break;
        case 073: [self execute_decCX]; break;
        case 074: [self execute_decDX]; break;
        case 075: [self execute_decBX]; break;
        case 076: [self execute_decSP]; break;
        case 077: [self execute_decBP]; break;
        case 078: [self execute_decSI]; break;
        case 079: [self execute_decDI]; break;
        //0x5
        case 080: [self execute_pushAX]; break;
        case 081: [self execute_pushCX]; break;
        case 082: [self execute_pushDX]; break;
        case 083: [self execute_pushBX]; break;
        case 084: [self execute_pushSP]; break;
        case 085: [self execute_pushBP]; break;
        case 086: [self execute_pushSI]; break;
        case 087: [self execute_pushDI]; break;
        case 088: [self execute_popAX]; break;
        case 089: [self execute_popCX]; break;
        case 090: [self execute_popDX]; break;
        case 091: [self execute_popBX]; break;
        case 092: [self execute_popSP]; break;
        case 093: [self execute_popBP]; break;
        case 094: [self execute_popSI]; break;
        case 095: [self execute_popDI]; break;
        //0x6
        case 096:
        case 097: 
        case 098: 
        case 099: 
        case 100: 
        case 101: 
        case 102: 
        case 103: 
        case 104: 
        case 105: 
        case 106: 
        case 107: 
        case 108: 
        case 109: 
        case 110: 
        case 111: [self invalidOpcodeException]; break;
        //0x7
        case 112: [self execute_joJb]; break;
        case 113: [self execute_jnoJb]; break;
        case 114: [self execute_jbJb]; break;
        case 115: [self execute_jnbJb]; break;
        case 116: [self execute_jzJb]; break;
        case 117: [self execute_jnzJb]; break;
        case 118: [self execute_jbeJb]; break;
        case 119: [self execute_jaJb]; break;
        case 120: [self execute_jsJb]; break;
        case 121: [self execute_jnsJb]; break;
        case 122: [self execute_jpeJb]; break;
        case 123: [self execute_jpoJb]; break;
        case 124: [self execute_jlJb]; break;
        case 125: [self execute_jgeJb]; break;
        case 126: [self execute_jleJb]; break;
        case 127: [self execute_jgJb]; break;
        //0x8
        case 128:   // Group 1 EbIb
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_addEbIb]; break;
                        case 001: [self execute_orEbIb]; break;
                        case 002: [self execute_adcEbIb]; break;
                        case 003: [self execute_sbbEbIb]; break;
                        case 004: [self execute_andEbIb]; break;
                        case 005: [self execute_subEbIb]; break;
                        case 006: [self execute_xorEbIb]; break;
                        case 007: [self execute_cmpEbIb]; break;
                    }
                    break;
        case 129:   // Group 1 EvIv
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_addEvIv]; break;
                        case 001: [self execute_orEvIv]; break;
                        case 002: [self execute_adcEvIv]; break;
                        case 003: [self execute_sbbEvIv]; break;
                        case 004: [self execute_andEvIv]; break;
                        case 005: [self execute_subEvIv]; break;
                        case 006: [self execute_xorEvIv]; break;
                        case 007: [self execute_cmpEvIv]; break;
                    }
                    break;
        case 130:   // Group 1 EbIb  -- Clone of case 128, seems to be the same instructions
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_addEbIb]; break;
                        case 001: [self execute_orEbIb]; break;
                        case 002: [self execute_adcEbIb]; break;
                        case 003: [self execute_sbbEbIb]; break;
                        case 004: [self execute_andEbIb]; break;
                        case 005: [self execute_subEbIb]; break;
                        case 006: [self execute_xorEbIb]; break;
                        case 007: [self execute_cmpEbIb]; break;
                    }
                    break;
        case 131:   // Group 1 EvIb
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_addEvIb]; break;
                        case 001: [self execute_orEvIb]; break;
                        case 002: [self execute_adcEvIb]; break;
                        case 003: [self execute_sbbEvIb]; break;
                        case 004: [self execute_andEvIb]; break;
                        case 005: [self execute_subEvIb]; break;
                        case 006: [self execute_xorEvIb]; break;
                        case 007: [self execute_cmpEvIb]; break;
                    }
                    break;
        case 132: [self execute_testGbEb]; break;
        case 133: [self execute_testGvEv]; break;
        case 134: [self execute_xchgGbEb]; break;
        case 135: [self execute_xchgGvEv]; break;
        case 136: [self execute_movEbGb]; break;
        case 137: [self execute_movEvGv]; break;
        case 138: [self execute_movGbEb]; break;
        case 139: [self execute_movGvEv]; break;
        case 140: [self execute_movEwSw]; break;
        case 141: [self execute_leaGvM]; break;
        case 142: [self execute_movSwEw]; break;
        case 143: [self execute_popEv]; break;
        //0x9
        case 144: [self execute_nop]; break;
        case 145: [self execute_xchgCXAX]; break;
        case 146: [self execute_xchgDXAX]; break;
        case 147: [self execute_xchgBXAX]; break;
        case 148: [self execute_xchgSPAX]; break;
        case 149: [self execute_xchgBPAX]; break;
        case 150: [self execute_xchgSIAX]; break;
        case 151: [self execute_xchgDIAX]; break;
        case 152: [self execute_cbw]; break;
        case 153: [self execute_cwd]; break;
        case 154: [self execute_callAp]; break;
        case 155: [self execute_wait]; break;
        case 156: [self execute_pushf]; break;
        case 157: [self execute_popf]; break;
        case 158: [self execute_sahf]; break;
        case 159: [self execute_lahf]; break;
        //0xA
        case 160: [self execute_movALOb]; break;
        case 161: [self execute_movAXOb]; break;
        case 162: [self execute_movObAL]; break;
        case 163: [self execute_movObAX]; break;
        case 164: [self execute_movsb]; break;
        case 165: [self execute_movsw]; break;
        case 166: [self execute_cmpsb]; break;
        case 167: [self execute_cmpsw]; break;
        case 168: [self execute_testALIb]; break;
        case 169: [self execute_testAXIv]; break;
        case 170: [self execute_stosb]; break;
        case 171: [self execute_stosw]; break;
        case 172: [self execute_lodsb]; break;
        case 173: [self execute_lodsw]; break;
        case 174: [self execute_scasb]; break;
        case 175: [self execute_scasw]; break;
        //0xB
        case 176: [self execute_movALIb]; break;
        case 177: [self execute_movCLIb]; break;
        case 178: [self execute_movDLIb]; break;
        case 179: [self execute_movBLIb]; break;
        case 180: [self execute_movAHIb]; break;
        case 181: [self execute_movCHIb]; break;
        case 182: [self execute_movDHIb]; break;
        case 183: [self execute_movBHIb]; break;
        case 184: [self execute_movAXIv]; break;
        case 185: [self execute_movCXIv]; break;
        case 186: [self execute_movDXIv]; break;
        case 187: [self execute_movBXIv]; break;
        case 188: [self execute_movSPIv]; break;
        case 189: [self execute_movBPIv]; break;
        case 190: [self execute_movSIIv]; break;
        case 191: [self execute_movDIIv]; break;
        //0xC
        case 192: 
        case 193: [self invalidOpcodeException]; break;
        case 194: [self execute_retIw]; break;
        case 195: [self execute_ret]; break;
        case 196: [self execute_lesGvMp]; break;
        case 197: [self execute_ldsGvMp]; break;
        case 198: [self execute_movEbIb]; break;
        case 199: [self execute_movEvIv]; break;
        case 200:
        case 201: [self invalidOpcodeException]; break;
        case 202: [self execute_retfIw]; break;
        case 203: [self execute_retf]; break;
        case 204: [self execute_int3]; break;
        case 205: [self execute_intIb]; break;
        case 206: [self execute_into]; break;
        case 207: [self execute_iret]; break;
        //0xD
        case 208:   // Group 2 Eb1
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_rolEb1]; break;
                        case 001: [self execute_rorEb1]; break;
                        case 002: [self execute_rclEb1]; break;
                        case 003: [self execute_rcrEb1]; break;
                        case 004: [self execute_shlEb1]; break;
                        case 005: [self execute_shrEb1]; break;
                        case 006: [self invalidOpcodeException]; break;
                        case 007: [self execute_sarEb1]; break;
                    }
                    break;
        case 209:   // Group 2 Ev1
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_rolEv1]; break;
                        case 001: [self execute_rorEv1]; break;
                        case 002: [self execute_rclEv1]; break;
                        case 003: [self execute_rcrEv1]; break;
                        case 004: [self execute_shlEv1]; break;
                        case 005: [self execute_shrEv1]; break;
                        case 006: [self invalidOpcodeException]; break;
                        case 007: [self execute_sarEv1]; break;
                    }
                    break;
        case 210:   // Group 2 EbCL
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_rolEbCL]; break;
                        case 001: [self execute_rorEbCL]; break;
                        case 002: [self execute_rclEbCL]; break;
                        case 003: [self execute_rcrEbCL]; break;
                        case 004: [self execute_shlEbCL]; break;
                        case 005: [self execute_shrEbCL]; break;
                        case 006: [self invalidOpcodeException]; break;
                        case 007: [self execute_sarEbCL]; break;
                    }
                    break;
        case 211:   // Group 2 EvCL
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_rolEvCL]; break;
                        case 001: [self execute_rorEvCL]; break;
                        case 002: [self execute_rclEvCL]; break;
                        case 003: [self execute_rcrEvCL]; break;
                        case 004: [self execute_shlEvCL]; break;
                        case 005: [self execute_shrEvCL]; break;
                        case 006: [self invalidOpcodeException]; break;
                        case 007: [self execute_sarEvCL]; break;
                    }
                    break;
        case 212: [self execute_aamI0]; break;
        case 213: [self execute_aadI0]; break;
        case 214: [self invalidOpcodeException]; break;
        case 215: [self execute_xlat]; break;
        case 216:
        case 217:
        case 218:
        case 219:
        case 220: 
        case 221: 
        case 222:
        case 223: [self invalidOpcodeException]; break;
        //0xE
        case 224: [self execute_loopnzJb]; break;
        case 225: [self execute_loopzJb]; break;
        case 226: [self execute_loopJb]; break;
        case 227: [self execute_jcxzJb]; break;
        case 228: [self execute_inALIb]; break;
        case 229: [self execute_inAXIb]; break;
        case 230: [self execute_outIbAL]; break;
        case 231: [self execute_outIbAX]; break;
        case 232: [self execute_callJv]; break;
        case 233: [self execute_jmpJv]; break;
        case 234: [self execute_jmpAp]; break;
        case 235: [self execute_jmpJb]; break;
        case 236: [self execute_inALDX]; break;
        case 237: [self execute_inAXDX]; break;
        case 238: [self execute_outDXAL]; break;
        case 239: [self execute_outDXAX]; break;
        //0xF
        case 240: [self execute_prefixLock]; break;
        case 241: [self invalidOpcodeException]; break;
        case 242: [self execute_prefixRepnz]; break;
        case 243: [self execute_prefixRepz]; break;
        case 244: [self execute_hlt]; break;
        case 245: [self execute_cmc]; break;
        case 246:   // Group 3a Eb
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_testEbIb]; break;
                        case 001: [self invalidOpcodeException]; break;
                        case 002: [self execute_notEb]; break;
                        case 003: [self execute_negEb]; break;
                        case 004: [self execute_mulEb]; break;
                        case 005: [self execute_imulEb]; break;
                        case 006: [self execute_divEb]; break;
                        case 007: [self execute_idivEb]; break;
                    }
                    break;
        case 247:   // Group 3b Ev
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_testEvIv]; break;
                        case 001: [self invalidOpcodeException]; break;
                        case 002: [self execute_notEv]; break;
                        case 003: [self execute_negEv]; break;
                        case 004: [self execute_mulEv]; break;
                        case 005: [self execute_imulEv]; break;
                        case 006: [self execute_divEv]; break;
                        case 007: [self execute_idivEv]; break;
                    }
                    break;
        case 248: [self execute_clc]; break;
        case 249: [self execute_stc]; break;
        case 250: [self execute_cli]; break;
        case 251: [self execute_sti]; break;
        case 252: [self execute_cld]; break;
        case 253: [self execute_std]; break;
        case 254:   // Group 4 Eb
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_incEb]; break;
                        case 001: [self execute_decEb]; break;
                        case 002: 
                        case 003: 
                        case 004: 
                        case 005: 
                        case 006: 
                        case 007: [self invalidOpcodeException]; break;
                    }
                    break;
        case 255:   // Group 5 Ev
                    var modrm = i8086ModRMMake([self peek]); // The fetch of the byte will be done by the respective exec method
                    switch (modrm.reg2) //modrm.nnn
                    {
                        case 000: [self execute_incEv]; break;
                        case 001: [self execute_decEv]; break;
                        case 002: [self execute_callEv]; break;
                        case 003: [self execute_callMp]; break;
                        case 004: [self execute_jmpEv]; break;
                        case 005: [self execute_jmpMp]; break;
                        case 006: [self execute_pushEv]; break;
                        case 007: [self invalidOpcodeException]; break;
                    }
                    break;
    }
}

- (void)execute_addEbGb
{
    /* ADD r/m8,r8
    2+ - 3/24+
    O---SZAPC */
    var modrm = i8086ModRMMake([self fetch]);
}

@end

// FPU instruction extensions
@implementation i8086 (i8087)

@end


/* In first IBM PCs this is where the ROM resided that contained the BIOS and a BASIC interpreter,
 however in later machines the ROM exists at the end of the addressable space and then the BIOS
 is loaded into this location in memory. The CPU starts using the address located at the very end
 of the addressable space.
 
 Memory Map: http://www.elecnet.chandra.ac.th/learn/tipntrick/xt/default.htm
*/

var IBMPC_ROMStartAddress = 983040, // 0xF0000 (F000:0)
    IBMPC_ROMSize = 65535;          // 0xFFFF
    
@implementation PC : CPObject
{
    BOOL on;
    
    CPU cpu;
    RAM ram;
    ROM rom;
    
    CPArray devices;
}

- (id)init
{
    if(self = [super init])
    {
        devices = {};
    }
    return self;
}

- (void)performCycle
{
    if (!on)
        return;
        
    //[cpu fetch];
    //[cpu execute];
    [cpu fetchAndExecute];
}

- (void)reset
{
    var i = 0,
        count = devices.length;
    [cpu reset];
    [ram reset];
    for (;i < count; i++)
        [devices[i] count];
}

- (void)powerDown
{
    // send powerDown to everything
}

@end

@implementation JSEmu : CPObject
{
}

- (id)init
{
    if(self = [super init])
    {
    }
    return self;
}

@end

function main(args, namedArgs)
{
    //CPApplicationMain(args, namedArgs);
}
