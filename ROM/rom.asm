; rom.asm
; Stephen Paul Ierodiaconou

; For NASM

; http://wiki.osdev.org/Babystep1
; nasm boot.asm -f bin -o boot.bin
; dd if=boot.bin of=/dev/fd0

; ROM start location in IBM PCs
[ORG 0xF0000]

start:
    mov al,0x1
    add al,0x1
    hlt
    
    
 
    times 0xFFFF-($-$$) db 0