/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Simarjit Dhillon
 */

/** namespace. */
var rhit = rhit || {};

// rhit.FB_COLLECTION_MOVIEQUOTES = "MovieQuotes";
// rhit.FB_KEY_QUOTE = "quote";
// rhit.FB_KEY_MOVIE = "movie";
// rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
// rhit.FB_KEY_AUTHOR = "author";
// rhit.fbMovieQuotesManager = null;
// rhit.fbSingleQuoteManager = null;
// rhit.fbAuthManager = null;

rhit.FB_COLLECTION_EQUATIONLOG = "EquationLog";
rhit.FB_KEY_SUBJECT = "subject";
rhit.FB_KEY_EQUATION = "equation";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_USER = "user";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_EQNNAME = "eqnName";
rhit.FB_KEY_COMMENT = "comment";
rhit.FB_KEY_RATING= "rating";
rhit.FB_KEY_DESCRIPTION = "description";

rhit.fbEquationListManager = null;
rhit.fbSingleEquationManager = null;
rhit.fbAuthManager = null;

var moderators = ["ZR9wMov3LGdssF39AfPeyT7cUMl1","ogA3V3DLX6bUSjr50PgjAjpLYL22"];


//From: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

function addToList(content, type, fileName) {
	let li = document.createElement("li");
	let a = document.createElement("a");
	
	if (type === 'url') {
		a.href = content;
		a.textContent = content;
		a.target = "_blank"; // Opens in a new tab
	} else if (type === 'pdf') {
		a.href = content;
		a.textContent = `PDF: ${fileName}`;
		a.download = fileName; // This allows the file to be downloaded
	}
	

	li.appendChild(a);
	document.getElementById("contentList").appendChild(li);
}


rhit.ListPageController = class {
	constructor() {
		// document.querySelector("#submitAddQuote").onclick = (event) => {	
		// };
		document.querySelector("#menuShowAllQuotes").addEventListener("click", (event) => {
			window.location.href = "/list.html";
		});
		document.querySelector("#menuShowMyQuotes").addEventListener("click", (event) => {
			window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
		});
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		document.querySelector("#submitAddEquation").addEventListener("click", (event) => {
			const subject = document.querySelector("#inputSubject").value;
			const equation = document.querySelector("#inputLog").value;
			const name = document.querySelector("#inputName").value;
			const eqnName = document.querySelector("#inputDate").value;
			const comment = document.querySelector("#inputComment").value;
			const rating = document.querySelector("#inputRating").value;
			const description = "Initial Description";
			rhit.fbEquationListManager.add(subject, equation, name, eqnName, comment, rating, description);

		});

		$("#addEquationDialog").on("show.bs.modal", (event) => {
			// Pre animation
			document.querySelector("#inputSubject").value = "";
			document.querySelector("#inputLog").value = "";
			document.querySelector("#inputName").value = "";
			document.querySelector("#inputDate").value ="";
			document.querySelector("#inputComment").value = "";
			document.querySelector("#inputRating").value="";
			
		});


		$("#addEquationDialog").on("shown.bs.modal", (event) => {
			// Post animation
			document.querySelector("#inputSubject").focus();
		});

		//Start Listening
		rhit.fbEquationListManager.beginListening(this.updateList.bind(this));

	}


	updateList() {

		console.log("I need to update list on the page");
		console.log(`Num quotes = ${rhit.fbEquationListManager.length}`);
		console.log(`Example quote = `, rhit.fbEquationListManager.getEquationAtIndex(0));

		// Make a new quoteListContainer
		const newList = htmlToElement('<div id="equationListContainer"></div>');

		
			// document.querySelector("#cardRating").style.display = "flex";
		

		

		// Fill the quoteListContainer with quote cards using a loop 
		for (let i = 0; i < rhit.fbEquationListManager.length; i++) {
			const eq = rhit.fbEquationListManager.getEquationAtIndex(i);
			const newCard = this._createCard(eq);

			if(eq.rating == "5" || eq.rating == "4"){
				newCard.style.backgroundColor = "green";
			}else if(eq.rating == "3" || eq.rating == "2"){
				newCard.style.backgroundColor = "yellow";
			}else if(eq.rating == "1"){
				newCard.style.backgroundColor = "red";
			} 

			renderLatexInCard(newCard);

			newCard.onclick = (event) => {
				// console.log(`You clicked on ${mq.id} `);
				// rhit.storage.setMovieQuoteId(mq.id);
				window.location.href = `/details.html?id=${eq.id}`;

			};

			newList.appendChild(newCard);
		}

		// Remove the old quoteListContainer
		const oldList = document.querySelector("#equationListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		// Put in the new quoteListContainer
		oldList.parentElement.appendChild(newList);

	}

	_createCard(log) {
		return htmlToElement(`
			<div class="card" style="border-radius: 10%">
				<div class="card-body" style="border-radius: 10%">
					<h6 class="card-subtitle mb-2 text-muted">Name: ${log.name}</h6>
					<h4 class="card-title">Subject: ${log.subject}</h4>
					<h6 class="card-subtitle mb-2 text-muted">Equation Name: ${log.eqnName}</h6>
					<h5 class="latexOutput mb-2">${log.equation}</h5>
					<div id="output"></div>
					<h6 class="card-subtitle mb-2">Comment: ${log.comment}</h6>
					<h6 class="card-subtitle mb-2" style="display: hidden">${log.rating}</h6>
				</div>
			</div>`);
	}

}


rhit.Equation = class {
    constructor(id, subject, equation, name, eqnName, comment, rating, description) {
        this.id = id;
        this.subject = subject;
        this.equation = equation;
        this.name = name;
        this.eqnName = eqnName;
        this.comment = comment;
        this.rating = rating;
		this.description = description;
    }
}

rhit.FbEquationListManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_EQUATIONLOG);
		this._unsubscribe = null;
	}
	add(subject, equation, name, eqnName, comment, rating, description) {
		// Add a new document with a generated id.
		this._ref.add({
				[rhit.FB_KEY_SUBJECT]: subject,
				[rhit.FB_KEY_EQUATION]: equation,
				[rhit.FB_KEY_USER]: rhit.fbAuthManager.uid,
				[rhit.FB_KEY_EQNNAME]: eqnName,
				[rhit.FB_KEY_NAME]: name,
				[rhit.FB_KEY_COMMENT]: comment,
				[rhit.FB_KEY_RATING]: rating,
				[rhit.FB_KEY_DESCRIPTION]: description,
				[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
			})
			.then(function (docRef) {
				console.log("Document written with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.error("Error adding documents: ", error);
			});

	}


	beginListening(changeListener) {

		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);
		if(this._uid) {
			query = query.where(rhit.FB_KEY_USER, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			console.log("Equation Update");

			this._documentSnapshots = querySnapshot.docs;
			// querySnapshot.forEach((doc) => {
			// 	console.log(doc.data());
			// });

			changeListener();
		});
	}


	stopListening() {
		this._unsubscribe();
	}


	// update(id, quote, movie) {    }
	// delete(id) { }
	get length() {
		return this._documentSnapshots.length;
	}

	getEquationAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const eq = new rhit.Equation(
			docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_SUBJECT),
			docSnapshot.get(rhit.FB_KEY_EQUATION),
			docSnapshot.get(rhit.FB_KEY_NAME),
			docSnapshot.get(rhit.FB_KEY_EQNNAME),
			docSnapshot.get(rhit.FB_KEY_COMMENT),
			docSnapshot.get(rhit.FB_KEY_RATING),
			docSnapshot.get(rhit.FB_KEY_DESCRIPTION)
		);
		return eq;
	}
}

rhit.DetailPageController = class {
	constructor() {

		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});

		// TRYING STUFF

		// document.getElementById("urlBtn").addEventListener("click", function() {
		// 	let url = document.getElementById("urlInput").value;
		// 	if (url) {
		// 		addToList(url, 'url');
		// 		var timestamp = Number(new Date());
		// 		var storageRef = firebase.storage().ref(timestamp.toString());
		// 		storageRef.put(url);
		// 	}

			
		// });
		
		// document.getElementById("pdfBtn").addEventListener("click", function() {
		// 	let file = document.getElementById("pdfInput").files[0];
		// 	if (file) {
		// 		let objectURL = URL.createObjectURL(file);
		// 		addToList(objectURL, 'pdf', file.name);
		// 		// var timestamp = Number(new Date());
		// 		var storageRef = firebase.storage().ref(rhit.fbEquationListManager._uid);
		// 		storageRef.put(file);
		// 	}

		
		// });


		// document.querySelector("#updateDescription").addEventListener("click", (event) => {
		// 	let currentDescription = rhit.fbSingleEquationManager.description;


		// 	document.getElementById('inputDescription').value = currentDescription;
			

		// 	document.getElementById('updateArea').style.display = 'block';
		// });

		// document.querySelector("#submitDescription").addEventListener("click", (event) => {
		// 	let updatedDescription = document.getElementById('inputDescription').value;

			
		// 	document.getElementById('description').innerText = updatedDescription;
		// 	rhit.fbSingleEquationManager.description = updateDescription;

			
		// 	document.getElementById('updateArea').style.display = 'none';
		// });
		








		// --------------

		document.querySelector("#submitEditEquation").addEventListener("click", (event) => {
			const subject = document.querySelector("#inputSubject").value;
			const equation = document.querySelector("#inputLog").value;
			const name = document.querySelector("#inputName").value;
			const eqnName = document.querySelector("#inputDate").value;
			const comment = document.querySelector("#inputComment").value;
			const rating = document.querySelector("#inputRating").value;
			const description = document.querySelector("#inputDescription").value;
			rhit.fbSingleEquationManager.update(subject, equation, name, eqnName, comment, rating, description);
		});

		$("#editEquationDialog").on("show.bs.modal", (event) => {
			// Pre animation
			document.querySelector("#inputSubject").value = rhit.fbSingleEquationManager.subject;
			document.querySelector("#inputLog").value = rhit.fbSingleEquationManager.equation;
			document.querySelector("#inputName").value = rhit.fbSingleEquationManager.name;
			document.querySelector("#inputDate").value = rhit.fbSingleEquationManager.eqnName;
			document.querySelector("#inputComment").value = rhit.fbSingleEquationManager.comment;
			document.querySelector("#inputRating").value = rhit.fbSingleEquationManager.rating;
			document.querySelector("#inputDescription").value = rhit.fbSingleEquationManager.description;
		});


		$("#editQuoteDialog").on("shown.bs.modal", (event) => {
			// Post animation
			document.querySelector("#inputQuote").focus();
		});

		document.querySelector("#submitDeleteEquation").addEventListener("click", (event) => {
			rhit.fbSingleEquationManager.delete().then(() => {
				console.log("Document successfully deleted!");
				window.location.href = "/list.html";
			}).catch((error) => {
				console.error("Error removing document: ", error);
			});


		});


		rhit.fbSingleEquationManager.beginListening(this.updateView.bind(this));


	}
	updateView() {
		// renderLatex();
		// document.querySelector("#cardQuote").innerHTML = rhit.fbSingleQuoteManager.quote;
		// document.querySelector("#cardMovie").innerHTML = rhit.fbSingleQuoteManager.movie;
		let equationDiv = document.querySelector("#cardPost");
		equationDiv.innerHTML = "\\[" + rhit.fbSingleEquationManager.equation + "\\]";

		// Ask MathJax to update the rendering
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, equationDiv]);

		console.log(rhit.fbSingleEquationManager.equation);


		document.querySelector("#cardSubject").innerHTML = rhit.fbSingleEquationManager.subject;
		// document.querySelector("#cardPost").innerHTML = rhit.fbSingleEquationManager.equation;
		document.querySelector("#cardName").innerHTML = rhit.fbSingleEquationManager.name;
		document.querySelector("#cardeqnName").innerHTML = rhit.fbSingleEquationManager.eqnName;
		document.querySelector("#cardComment").innerHTML = rhit.fbSingleEquationManager.comment;
		document.querySelector("#cardRating").innerHTML = rhit.fbSingleEquationManager.rating;
		document.querySelector("#description").innerHTML = rhit.fbSingleEquationManager.description;



		console.log(moderators.includes(rhit.fbAuthManager.uid));
		if(moderators.includes(rhit.fbAuthManager.uid)){
			document.querySelector("#cardRating").style.display = "flex";
			document.querySelector("#inputRating").style.display = "flex";

		}

		if(rhit.fbSingleEquationManager.user == rhit.fbAuthManager.uid || moderators.includes(rhit.fbAuthManager.uid)){
			document.querySelector("#menuEdit").style.display = "flex";
			document.querySelector("#menuDelete").style.display = "flex";
		}

	}

	






}

rhit.FbSingleEquationManager = class {
	constructor(movieQuoteId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_EQUATIONLOG).doc(movieQuoteId);
		console.log(`Listening to ${this._ref.path}`);
	}

	beginListening(changeListener) {

		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
				// window.location.href = "/";
			}
		});

	}

	stopListening() {
		this._unsubscribe();
	}
	update(subject, equation, name, eqnName, comment, rating, description) {
		this._ref.update({
				[rhit.FB_KEY_SUBJECT]: subject,
				[rhit.FB_KEY_EQUATION]: equation,
				[rhit.FB_KEY_NAME]: name,
				[rhit.FB_KEY_EQNNAME]: eqnName,
				[rhit.FB_KEY_COMMENT]: comment,
				[rhit.FB_KEY_RATING]: rating,
				[rhit.FB_KEY_DESCRIPTION] : description,
				[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
			})
			.then(() => {
				console.log("Document successfully updated!");
			})
			.catch((error) => {
				// The document probably doesn't exist.
				console.error("Error updating document: ", error);
			});
	}
	delete() {
		return this._ref.delete();

	}

	get subject() {
		return this._documentSnapshot.get(rhit.FB_KEY_SUBJECT);
	}

	get equation() {
		return this._documentSnapshot.get(rhit.FB_KEY_EQUATION);
	}
	get user(){
		return this._documentSnapshot.get(rhit.FB_KEY_USER);
	}
	get name(){
		return this._documentSnapshot.get(rhit.FB_KEY_NAME);
	}
	get eqnName(){
		return this._documentSnapshot.get(rhit.FB_KEY_EQNNAME);
	}
	get comment(){
		return this._documentSnapshot.get(rhit.FB_KEY_COMMENT);
	}
	get rating(){
		return this._documentSnapshot.get(rhit.FB_KEY_RATING);
	}
	get description(){
		return this._documentSnapshot.get(rhit.FB_KEY_DESCRIPTION);
	}
}



// rhit.storage = rhit.storage || {};
// rhit.storage.MOVIEQUOTE_ID_KEY = "movieQuoteId";
// rhit.storage.getMovieQuoteId = function() {
// 	const mqId = sessionStorage.getItem(rhit.storage.MOVIEQUOTE_ID_KEY);
// 	if(!mqId){
// 		console.log("No movie quote id in session storage");
// 	}
// 	return mqId;
// };

// rhit.storage.setMovieQuoteId = function(movieQuoteId){
// 	 sessionStorage.setItem(rhit.storage.MOVIEQUOTE_ID_KEY, movieQuoteId);
// };

rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		};

	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});

	}
	signIn() {
		console.log("TO DO: Sign in using rosefire");
		Rosefire.signIn("0d49b042-00d3-42de-9c6e-e8f13607a71f", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);



			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid.');
				} else {
					console.error("Custom auth error", errorCode, errorMessage);
				}
			});

		});

	}
	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		});
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/list.html";
	}

	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}


};

rhit.initializePage = function () {
	
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#listPage")) {
		console.log("You are on the list page");
		const uid = urlParams.get("uid");
		rhit.fbEquationListManager = new rhit.FbEquationListManager(uid);
		new rhit.ListPageController();
	}

	if (document.querySelector("#detailPage")) {
		console.log("You are on the detail page");
		// const movieQuoteId = rhit.storage.getMovieQuoteId();
		const urlParams = new URLSearchParams(window.location.search);
		const movieQuoteId = urlParams.get("id");

		if (!movieQuoteId) {
			window.location.href = "/";
		}

		rhit.fbSingleEquationManager = new rhit.FbSingleEquationManager(movieQuoteId);
		new rhit.DetailPageController();
	}

	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page");
		new rhit.LoginPageController();
	}
};


/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("auth change callback fired. TO DO: Check for redirects and init the page");
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		
		rhit.checkForRedirects();
		rhit.initializePage();
		
		rhit.startFirebaseUI();

	});

	// Temp code for Read and Add
	// 	const ref = firebase.firestore().collection("MovieQuotes");
	// 	ref.onSnapshot((querySnapshot) => {

	//   		querySnapshot.forEach((doc) => {
	// 			console.log(doc.data());
	//   	});
	// });

	// ref.add({
	// 	quote: "My first test",
	// 	Movie: "My first movie"
	// });


};

function renderLatex(inputCode) {
    // let latexCode = document.getElementById("inputLog").value;
    // let outputDiv = document.getElementById("output");
    
    // Put the LaTeX code inside \( ... \) or \[ ... \] delimiters to render inline or block respectively
    outputDiv.innerHTML = "\\[" + inputCode + "\\]";

    // Ask MathJax to update the rendering
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, outputDiv]);
	// document.getElementById("latexInput").addEventListener("input", renderLatex);
}
// function renderLatex(textareaID, outputID) {
//     const latexCode = document.getElementById(textareaID).value;
//     const outputDiv = document.getElementById(outputID);
    
//     outputDiv.innerHTML = "\\[" + latexCode + "\\]";
//     MathJax.Hub.Queue(["Typeset", MathJax.Hub, outputDiv]);
// 	document.getElementById(textareaID).addEventListener("input", renderLatex);
// }

function renderLatexInCard(cardElement) {
    const latexAreas = cardElement.querySelectorAll('.latexOutput');

    latexAreas.forEach(area => {
        const latexCode = area.textContent;

        // Set the content for MathJax to render
        area.innerHTML = "\\[" + latexCode + "\\]";

        // Ask MathJax to render it
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, area]);
    });
}

rhit.startFirebaseUI = function() { 
	// FirebaseUI config.
	var uiConfig = {
	   signInSuccessUrl: '/',
	   signInOptions: [
		 // Leave the lines as is for the providers you want to offer your users.
		 firebase.auth.GoogleAuthProvider.PROVIDER_ID,
		 firebase.auth.EmailAuthProvider.PROVIDER_ID,
		 firebase.auth.PhoneAuthProvider.PROVIDER_ID,
		 firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
	   ],
	   
	 };

	 const ui = new firebaseui.auth.AuthUI(firebase.auth());
	 ui.start('#firebaseui-auth-container', uiConfig);
}

// function openTextArea() {
// 	// Get current content of the div
// 	let currentDescription = document.getElementById('description').innerText;

// 	// Set the content to the textarea
// 	document.getElementById('descriptionInput').value = currentDescription;

// 	// Display the textarea
// 	document.getElementById('updateArea').style.display = 'block';
// }

// function updateDescription() {
// 	// Get updated content from the textarea
// 	let updatedDescription = document.getElementById('descriptionInput').value;

// 	// Set the updated content to the div
// 	document.getElementById('description').innerText = updatedDescription;

// 	// Hide the textarea
// 	document.getElementById('updateArea').style.display = 'none';
// }







rhit.main();