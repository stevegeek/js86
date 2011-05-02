JSEmu.Emulator = Class.extend(
{
    init: function (onready)
    {
        this.onReady = onready; // callback when we are connected to PC
        this.postedMessages = new Array();
        this.scriptID = -1;
        this.IBMPC = new SharedWorker('IBMPC.js');

        // FIXME: is this working?
        this.IBMPC.onerror = function(event){
            throw new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
        };

        this.IBMPC.port.onmessage = bind(this, this.parseMessage);
    },

    parseMessage: function (event)
    {
        var message = event.data,
            messagetypeinfo =  message.type.split(':'),
            roottype = messagetypeinfo[0],
            extrainfo = messagetypeinfo[1],
            callback = this.checkMessageWasPostedAndGetCallback(message);

        switch (roottype)
        {
            case 'sys':
                switch (extrainfo)
                {
                    case 'connid':
                        console.log('CONNID = '+ message.body)
                        this.scriptID = parseInt(message.body);
                        this.onReady();
                        break;
                    case 'ack':
                        console.log('ACK for '+ message.body)
                        break;
                    case 'hlt':
                        console.log('HLT! '+ message.body)
                        break;
                }
                break;
            case 'log':
                JSEmu.logToHTMLLog(extrainfo, roottype, event.data.body);
                break;
        }

        if (callback)
            callback(message);
    },

    checkMessageWasPostedAndGetCallback: function (message)
    {
        if (typeof message.id === 'undefined')
            return null;

        var i = 0,
            count = this.postedMessages.length;
        console.log('try to find ' + message.id)
        for (; i < count; i++)
        {
            if (this.postedMessages[i].id === message.id)
            {
                // found , remove from list
                console.log('found ' + message.id)
                var callback = this.postedMessages[i].callback;
                this.postedMessages.remove(i);
                console.log('new len '+ this.postedMessages.length)
                return callback;
            }
        }
        return null;
    },

    postMessageToPC: function (messageType, messageData)
    {
        this.IBMPC.port.postMessage({
                id:JSEmu.messageID,
                type:messageType,
                data:messageData,
                fromScriptID:this.scriptID});
        JSEmu.messageID++;
    },

    postMessageToPCWithCallback: function(messageType, messageData, callback)
    {
        this.postedMessages.push({name:messageType, id:JSEmu.messageID, callback: callback});
        this.postMessageToPC(messageType, messageData);
    },

    // ********* API **********
    loadBinaryFileAndRun: function (fileName, emuCallback)
    {
        this.postMessageToPCWithCallback(
            'loadBinaryFromURLIntoRam',
            {
                binaryURL:fileName,
                startAddress:0
            },
            bind(this, function ()
                {
                    //console.log('callback');

                    this.postMessageToPCWithCallback('powerUpAndRun', {}, bind(this, function ()
                        {
                            //console.log('running')
                            this.postMessageToPCWithCallback('testmsg', {}, function (message)
                                {
                                    console.log(message)
                                    JSEmu.logToHTMLLog('info', "ACKTEST", 'The testmsg was serviced at this point');
                                }
                            );
                        })
                    );
                }
            )
        );
    }
});
