'use strict';

class Messenger{

	constructor ( obj ){
		this.user_name = obj.user_name;
		this.uuid = obj.uuid;
		this.euid = obj.ready_event_euid;
		this.text_input_element = document.getElementsByClassName(obj.text_input_classname)[0];
		this.button_submit_element = document.getElementsByClassName(obj.button_submit_classname)[0];
		this.chat_area_element = document.getElementsByClassName(obj.chat_area_classname)[0];
		this.current_cuid;
		this.current_message_text;
	}
	

	//write cuid to sessionStorage
	storeCuid( cuid ){
		sessionStorage.setItem('cuid' , cuid);
	}

	//set Messenger.current_cuid
	setCuid( cuid ){
		this.current_cuid = cuid;
	}

	//get CUID from sessionStorage or get first cuid from API by request 
	async initCuid( uuid ){
		let ses_cuid = sessionStorage.getItem('cuid');
		if(ses_cuid){
			this.setCuid( ses_cuid );
		}
		else{
			let new_cuid = await this.getCuidRequest( uuid );
			this.setCuid(new_cuid);
			this.storeCuid(new_cuid);
		}
	}
	
	//send request to API and return CUID
	async getCuidRequest( uuid ){
		let request_options= {
		    method: "POST",
		    body: JSON.stringify({ 'uuid':uuid })
		}
		try{
			const response = await fetch("https://biz.nanosemantics.ru/api/2.1/json/Chat.init" , request_options);
			const data = await response.json();
			return data.result.cuid
		}
		catch(e){
			console.log(e.message);
		}
	}

	//send READY request to API
	async readyChatRequest( cuid , euid ){
		let request_options = {
		    method: "POST",
		    body: JSON.stringify({'cuid': cuid , 'euid': euid})
		}
		try{
			const response = await fetch("https://biz.nanosemantics.ru/api/2.1/json/Chat.event" , request_options);
			const data = await response.json();
			return data.result.text.value;
		}
		catch(e){
			console.log(e.message);
		}
	}
	
	// main func initializing Chat
	async createChat(){
		await this.initCuid( this.uuid );
		console.log( this.current_cuid );
		let message = await this.readyChatRequest( this.current_cuid , this.euid );
		console.log(message)
		new Message(message, 'bot_message', this.chat_area_element)
	}
	
	async sendMessageRequest( cuid, text_message ){
		let request_options = {
			method: "POST",
			headers: {  
				"Accept": "application/json",
				"Content-Type": "application/json;charset=UTF-8"  
			},
		    body: JSON.stringify({'cuid': cuid , 'text': text_message })
		}
		try{
			const response = await fetch("https://biz.nanosemantics.ru/api/2.1/json/Chat.request" , request_options);
			const data = await response.json();
			
			return data.result.text.value;
		}
		catch(e){
			console.log(e.message);
		}
	}

	async createMessage( text ){
		new Message( text, 'user_message', this.chat_area_element)
		if(this.current_cuid){
			let api_response = await this.sendMessageRequest( this.current_cuid , text )
			new Message( api_response, 'bot_message', this.chat_area_element)
		}
	}

}

class Message{
	constructor(text, side, target_element){
		this.text = text;
		this.side = side;
		this.element = document.createElement('div');
		this.element.className = "message";
		this.element.classList.add(side);
		this.element.innerHTML = text;
		target_element.appendChild(this.element);
		target_element.scrollTop = target_element.scrollHeight;
	}
 }

window.onload =  () => {

	let initMessengerData = {
		user_name: 'Vlad',
		uuid: '772c9859-4dd3-4a0d-b87d-d76b9f43cfa4',
		ready_event_euid: '00b2fcbe-f27f-437b-a0d5-91072d840ed3',
		text_input_classname:'messageText',
		button_submit_classname:'messageSubmitButton',
		chat_area_classname: 'chatArea'
	}

	let messenger = new Messenger({ ...initMessengerData });
	messenger.createChat();

	document.addEventListener('keydown',(e)=>{
		if(e.keyCode == 13){
			messenger.button_submit_element.onclick();
		}
	})

	messenger.button_submit_element.onclick = () => {
		if(messenger.text_input_element.value!=''){
			messenger.current_message_text = messenger.text_input_element.value
			messenger.createMessage(messenger.current_message_text);
			messenger.text_input_element.value = '';
		}
		else{
			alert('Введите что-нибудь')
		}
		
	}
}