"use strict";


// loader-code: wait until gmailjs has finished loading, before triggering actual extensiode-code.
const loaderId = setInterval(() => {
    if (!window._gmailjs) {
        return;
    }

    clearInterval(loaderId);
    startExtension(window._gmailjs);
}, 100);


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


function sendData(eventType, data){

	var sendData = {};

	sendData['call'] = 'write';
	sendData['eventType'] = eventType;
	sendData['data'] = data;

	console.log('----' + eventType + '----');
	console.log(data);

	chrome.runtime.sendMessage('bhhogfkjnaikemfloacacpcikllmhndl', sendData, (resp) => {
		if (!resp){ console.error('SEND_DATA FAILED.'); }
	});
}

function sendLoad(e){
        const userEmail = gmail.get.user_email();

	let unread={};
	try{
		let targ = document.querySelectorAll('[role="navigation"]')[0];
		let els = targ.querySelectorAll("[aria-label]");
		for (let i in els){
		   try{	
			var label = els[i].textContent;	
			var number = parseInt(els[i].parentElement.parentElement.getElementsByTagName('div')[0].textContent);
			unread[label] = number;	
		   }catch(e){
			console.error(e);
		   }
		}
	}catch(e){
		console.error(e);
	}

	let lastActive = '';
	try{
		let targ = document.querySelectorAll('[role="contentinfo"]')[0];
		let els = targ.querySelectorAll('div:not(:has(*))');
		for (let i in els){
		   try{	
			let str = els[i].textContent;
			if(str.includes('Last account activity:')){

				console.log(str);   
				lastActive = str.replace('Last account activity:','').trim();
				break;
			}
		   }catch(e){
			console.error(e);
		   }
		}
	}catch(e){
		console.error(e);
	}


	sendData(e, {
		'userEmail': userEmail, 
		'unread': unread,
		'lastActive': lastActive 
	});    

}


// actual extension-code
function startExtension(gmail) {
    console.log("Extension loading...");
    window.gmail = gmail;

    gmail.observe.on("poll", () => { sendLoad('poll'); });
    gmail.observe.on("refresh", () => { sendLoad('refresh'); });
    gmail.observe.on("load", () => {

	setTimeout(() => {sendLoad('load');}, 500);

	document.addEventListener('click', function(e) {
	    e = e || window.event;
	    var target = e.target || e.srcElement;

	    //if delete event	
	    if (target.outerHTML.includes('data-tooltip="Delete"')){

		    console.log('delete event');

		    //get parent parent 'tr' and then all spans inside, pull out text
	    	    let spans = target.closest('tr').closest('tr').getElementsByTagName("span");

		    let spanSet = new Set();
	    	    for (let s in spans){
		      spanSet.add(spans[s].textContent);
		    }	

	    	    //turn that to data and send
	    	    sendData('delete', {'text': Array.from(spanSet)}); 
	    }


	}, false);

        gmail.observe.on("view_email", (domEmail) => {

            var emailData = gmail.new.get.email_data(domEmail);
	    emailData['content_html'] = emailData["content_html"].replace(/<[^>]+>/g, ' ');

	    sendData("view_email", emailData);	
        });

        gmail.observe.on("send_message", (url, body, data, xhr) => {

	    var temp_body = body.replace(/<[^>]+>/g, ' ');

	    sendData("send_message", {
		'data':data,
		'url':url,
		'body':temp_body,
		'xhr':xhr    
	    });	
        });




//reply open + email_meta
//save_draft, discard_draft + sending email_meta
//reply send + sending email_meta
//delete + email_meta
//mark unread, mark read, star, unstar, mark important, mark not important, move folder + email_meta

        gmail.observe.on("compose", (compose) => {
            sendData("compose_open", {});
        });
        gmail.observe.on("compose_cancelled", (compose) => {
            sendData("compose_cancelled", {});
        });
    });

  		
}
