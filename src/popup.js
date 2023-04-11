
document.addEventListener('DOMContentLoaded', async () => {


 const downloadHistoryBtn = document.getElementById('download-history');
 downloadHistoryBtn.onclick = async () => {
	//await Database.download(true);
	chrome.runtime.sendMessage({call:'download'}, (resp) => {
		if (resp){
			console.log('success');
		} else{
			console.log('failed');
		}

	});
 };

/*
 const addBtn = document.getElementById('add');
 addBtn.onclick = async () => {
	//await Database.write('testEvent', {'a':'DATA DATA', 'b':'MORE DATA'});
	chrome.runtime.sendMessage({call:'write', eventType:'testEventType', data:{a:1, b:2}}, (resp) => {
		if (resp){
			console.log('success');
		} else{
			console.log('failed');
		}

	});
 };

 const readHistoryBtn = document.getElementById('read-history');
 readHistoryBtn.onclick = async () => {
	chrome.runtime.sendMessage({call:'get'}, (resp) => {
		if (resp){
			console.log(resp);
		} else{
			console.log('failed');
		}

	});
 };
*/

});
