//STORAGE FOR ACTIONS FROM GMAIL

//based on code from https://dev.to/paulasantamaria/chrome-extensions-local-storage-1b34
//No license included.
//This is very different from the example; the example uses one json key to write to
//storage.  When adding new values to storage, that list is called out of storage, an element
//is appended, and the list is pushed back to storage.  We will instead use a new key for
//each entry (timestamp).  This means we don't pull the same data object out of storage every
//time, append, and rewrite.




//load + load_meta
//poll, refresh + load_meta

//open + email_meta
//reply open + email_meta
//save_draft, discard_draft + sending email_meta
//reply send + sending email_meta
//delete + email_meta
//mark unread, mark read, star, unstar, mark important, mark not important, move folder + email_meta
//
//email meta = subject, body, to/from, bcc/cc, # in thread, date


// [datetime, action, {email_meta OR load_meta}]



//WE NEED: write, read, download, clear

class Database {

    //get all the data in the database	
    static get = () => {
        const promise = toPromise((resolve, reject) => {
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);

                resolve(result ?? []);
            });
        });

        return promise;
    }

    //clear the database	
    static clear = () => {
        const promise = toPromise((resolve, reject) => {
            chrome.storage.local.clear(() => {
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
                resolve(true);
            });
        });

        return promise;
    }

    //write to the database	
    static write = (eventType, data) => {
	console.log('called write');    

        const promise = toPromise((resolve, reject) => {
	    let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds	
            let ts = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
            chrome.storage.local.set({[ts]: {'e': eventType, 'data':data}}, () => {
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
                resolve(true);
            });
        });

        return promise;
    }

    //download database and clear if true passed
    static download = async (clear=false) => {
	console.log('called download');    

        let data = await this.get(); //get all data  
    	let url = 'data:application/json;base64,' + btoa(JSON.stringify(data)); //get ready for writing   

        const promise = toPromise((resolve, reject) => {

            let tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds	
            let ts = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);

	    let filename = ts.substring(5,7) + ts.substring(8,10) + ts.substring(2,4) + '_';
	    filename += ts.substring(11,13) + ts.substring(14,16) + ts.substring(17,19) + '_email.json';

            chrome.downloads.download({'url': url,'filename': filename}, (downloadId) => {
                if (downloadId === undefined) 
                    reject(chrome.runtime.lastError);

		if (clear){
		  return this.clear(resolve, reject);	
		} else {
		  resolve(true);
		}
            });
        });

        return promise;
    }
}


const toPromise = (callback) => {
    const promise = new Promise((resolve, reject) => {
        try {
            callback(resolve, reject);
        }
        catch (err) {
            reject(err);
        }
    });
    return promise;
}



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	switch(message.call){
	  case 'clear':
		Database.clear().then(() => {
      			sendResponse(true);
    		}, ()=> { sendResponse(false)});
		break;
	  case 'download':
		Database.download(true).then((results) => {
      			sendResponse(true);
    		}, ()=> { sendResponse(false)});
		break;
	  case 'get':
		Database.get().then((results) => {
      			sendResponse(results);
    		}, ()=> { sendResponse(false)});
		break;
	  case 'write':
		Database.write(message.eventType, message.data).then(() => {
      			sendResponse(true);
    		}, ()=> { sendResponse(false)});
	}
	return true;	
});
