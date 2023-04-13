//STORAGE FOR ACTIONS FROM GMAIL

//based on code from https://dev.to/paulasantamaria/chrome-extensions-local-storage-1b34
//No license included.
//This is very different from the example; the example uses one json key to write to
//storage.  When adding new values to storage, that list is called out of storage, an element
//is appended, and the list is pushed back to storage.  We will instead use a new key for
//each entry (timestamp).  This means we don't pull the same data object out of storage every
//time, append, and rewrite.

var Base64 = {

    // private property
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

    // public method for encoding
    , encode: function (input)
    {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length)
        {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2))
            {
                enc3 = enc4 = 64;
            }
            else if (isNaN(chr3))
            {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        } // Whend 

        return output;
    } // End Function encode 


    // public method for decoding
    ,decode: function (input)
    {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length)
        {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64)
            {
                output = output + String.fromCharCode(chr2);
            }

            if (enc4 != 64)
            {
                output = output + String.fromCharCode(chr3);
            }

        } // Whend 

        output = Base64._utf8_decode(output);

        return output;
    } // End Function decode 


    // private method for UTF-8 encoding
    ,_utf8_encode: function (string)
    {
        var utftext = "";
        string = string.replace(/\r\n/g, "\n");

        for (var n = 0; n < string.length; n++)
        {
            var c = string.charCodeAt(n);

            if (c < 128)
            {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048))
            {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else
            {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        } // Next n 

        return utftext;
    } // End Function _utf8_encode 

    // private method for UTF-8 decoding
    ,_utf8_decode: function (utftext)
    {
        var string = "";
        var i = 0;
        var c, c1, c2, c3;
        c = c1 = c2 = 0;

        while (i < utftext.length)
        {
            c = utftext.charCodeAt(i);

            if (c < 128)
            {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224))
            {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else
            {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        } // Whend 

        return string;
    } // End Function _utf8_decode 

}


//WE NEED: write, read, download, clear
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    switch(message.call){

	  case 'clear':
            chrome.storage.local.clear(() => {
                if (chrome.runtime.lastError)
                    sendResponse(chrome.runtime.lastError);
                sendResponse(true);
            });
	  break;

	  case 'get':
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError)
                    sendResponse(chrome.runtime.lastError);

                sendResponse(result ?? []);
            });
	  break;

	  case 'download':
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError)
                    sendResponse(chrome.runtime.lastError);

                let data = (result ?? []);
		let url = 'data:application/json;base64,' + Base64.encode(JSON.stringify(data)); //get ready for writing   

		let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds	
            	let ts = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

	    	let filename = ts.substring(5,7) + ts.substring(8,10) + ts.substring(2,4) + '_';
	    	filename += ts.substring(11,13) + ts.substring(14,16) + ts.substring(17,19) + '_email.json';

            	chrome.downloads.download({'url': url,'filename': filename}, (downloadId) => {
                	if (downloadId === undefined) 
			    sendResponse(chrome.runtime.lastError);

			chrome.storage.local.clear(() => {
			    if (chrome.runtime.lastError)
			        sendResponse(chrome.runtime.lastError);
			    sendResponse(true);
			});
	        });
            });
	  break;

	  case 'write':

	    let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds	
            let ts = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

            chrome.storage.local.set({[ts]: {'e': message.eventType, 'data':message.data}}, () => {
                if (chrome.runtime.lastError)
                    sendResponse(chrome.runtime.lastError);
                sendResponse(true);
            });
	  break;		

  }

  return true;	

});


chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {

    switch(message.call){

	  case 'clear':
            chrome.storage.local.clear(() => {
                if (chrome.runtime.lastError)
                    sendResponse(chrome.runtime.lastError);
                sendResponse(true);
            });
	  break;

	  case 'get':
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError)
                    sendResponse(chrome.runtime.lastError);

                sendResponse(result ?? []);
            });
	  break;

	  case 'download':
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError)
                    sendResponse(chrome.runtime.lastError);

                let data = (result ?? []);
		let url = 'data:application/json;base64,' + btoa(JSON.stringify(data)); //get ready for writing

		let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
            	let ts = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

	    	let filename = ts.substring(5,7) + ts.substring(8,10) + ts.substring(2,4) + '_';
	    	filename += ts.substring(11,13) + ts.substring(14,16) + ts.substring(17,19) + '_email.json';

            	chrome.downloads.download({'url': url,'filename': filename}, (downloadId) => {
                	if (downloadId === undefined)
			    sendResponse(chrome.runtime.lastError);

			chrome.storage.local.clear(() => {
			    if (chrome.runtime.lastError)
			        sendResponse(chrome.runtime.lastError);
			    sendResponse(true);
			});
	        });
            });
	  break;

	  case 'write':

	    let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
            let ts = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

            chrome.storage.local.set({[ts]: {'e': message.eventType, 'data':message.data}}, () => {
                if (chrome.runtime.lastError)
                    sendResponse(chrome.runtime.lastError);
                sendResponse(true);
            });
	  break;

  }

  return true;

});

