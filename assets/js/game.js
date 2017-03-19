// Initialize Firebase
var config = {
	apiKey: "AIzaSyB9J5mCkaiODl6iFiusJSj7IrWJVPfla68",
	authDomain: "rps-multiplayer-b0940.firebaseapp.com",
	databaseURL: "https://rps-multiplayer-b0940.firebaseio.com",
	storageBucket: "rps-multiplayer-b0940.appspot.com",
	messagingSenderId: "867997640650"
};
firebase.initializeApp(config);

//Firebase reference vars
var ref = firebase.database().ref();
var playersRef = firebase.database().ref("players");
var p1Ref = firebase.database().ref("players/1");
var p2Ref = firebase.database().ref("players/2");

//Local vars
var playerName;
var playerNum;
var turn = 1;

//Player enter event listener
$("#name-submit-button").click(function(e) {
	e.preventDefault();
	playerName = $("#player-name").val().trim();

	playersRef.once("value", function(snap) {
		if(snap.exists() === false) {
			playerNum = 1;
			p1Ref.update({
				name: playerName,
				wins: 0,
				losses: 0
			});
		} else {
			playerNum = 2;
			p2Ref.update({
				name: playerName,
				wins: 0,
				losses: 0
			});
			ref.update({
				turn: 1
			});
		}
	}).then(function() {
		$("#p-name").text(playerName);
		$("#p-num").text(playerNum);
		$("#you-are-message").show();
		$("#player-form").hide();
	});
});

//Firebase event listener for name values
p1Ref.child("name").on("value", function(snap) {
	if(snap.exists() === true) {
		$("#p1-name").text(snap.val());
	}
});

p2Ref.child("name").on("value", function(snap) {
	if(snap.exists() === true) {
		$("#p2-name").text(snap.val());
	}
});

//Firebase listener to initialize game (display choice for p1) when both p1 and p2 are detected
playersRef.on("value", function(snap) {
	if(snap.child(1).exists() === true && snap.child(2).exists() === true) {
		// hide new player input for 3rd parties
		$("#player-form").hide();
		
		//display p1 choices (only once despite listener running multiple times)
		if($("#p1-choices").val() === "" && playerNum === 1 && snap.child(1).child("choice").exists() === false && snap.child(2).child("choice").exists() === false) {
			console.log("display p1");
			console.log(snap.val());
			var r = $("<div>").text("Rock").attr("data-choice", "Rock").addClass("p1-choice");
			var p = $("<div>").text("Paper").attr("data-choice", "Paper").addClass("p1-choice");
			var s = $("<div>").text("Scissors").attr("data-choice", "Scissors").addClass("p1-choice");
			$("#p1-choices").append(r, p, s);	
		}

		//display game message when both players exist
		if(playerNum === 1) {
			if(snap.child(1).child("choice").exists() === false) {
				$("#game-message").text("It's Your Turn!");
				$("#game-message").show();
			} else {
				p2Ref.once("value", function(snap) {
					$("#game-message").text("Waiting for " + snap.val().name + " to choose...");
				});
				$("#game-message").show();
			}
		} else if(playerNum === 2) {
			if(snap.child(2).child("choice").exists() === false && snap.child(1).child("choice").exists() === false) {
				p1Ref.once("value", function(snap) {
					$("#game-message").text("Waiting for " + snap.val().name + " to choose...");
				});
				$("#game-message").show();
			} else {
				console.log(snap.child(2).child("choice").exists(), snap.child(1).child("choice").exists());
				$("#game-message").text("It's Your Turn!");
				$("#game-message").show();
			}
		}
	}
});

//Event listener for p1 clicking choice
$(document).on("click", ".p1-choice", function() {
	var p1Choice = $(this).attr("data-choice");
	p1Ref.update({
		choice: p1Choice
	});

	$("#p1-choices").text(p1Choice);
});

//after p1 has made choice, then render p2's choice
p1Ref.child("choice").on("value", function(snap) {
	if(snap.exists() === true) {
		//display p2 choices (only once despite listener running multiple times)
		if($("#p2-choices").val() === "" && playerNum === 2 && snap.child(2).child("choice").exists() === false) {
			console.log("display p2");
			var r = $("<div>").text("Rock").attr("data-choice", "Rock").addClass("p2-choice");
			var p = $("<div>").text("Paper").attr("data-choice", "Paper").addClass("p2-choice");
			var s = $("<div>").text("Scissors").attr("data-choice", "Scissors").addClass("p2-choice");
			$("#p2-choices").append(r, p, s);	
		}
	}
});

//Event listener for p2 clicking choice
$(document).on("click", ".p2-choice", function() {
	var p2Choice = $(this).attr("data-choice");
	p2Ref.update({
		choice: p2Choice
	});

	$("#p2-choices").text(p2Choice);
});

//Firebase listener after both players have made choices
playersRef.on("value", function(snap) {
	var p1Choice;
	var p2Choice;
	var p1Name;
	var p2Name;
	var p1Wins;
	var p2Wins;
	var p1Losses;
	var p2Losses;
	//only proceed to outcome if both players exist and both have choices
	if(snap.child(1).exists() === true && snap.child(2).exists() === true && snap.child(1).child("choice").exists() === true && snap.child(2).child("choice").exists() === true) {
		playersRef.once("value", function(snap) {
			p1Choice = snap.val()[1].choice;
			p2Choice = snap.val()[2].choice;
			p1Ref.child("choice").remove();
			p2Ref.child("choice").remove();
			p1Name = snap.val()[1].name;
			p2Name = snap.val()[2].name;
			p1Wins = snap.val()[1].wins;
			p2Wins = snap.val()[2].wins;
			p1Losses = snap.val()[1].losses;
			p2Losses = snap.val()[2].losses;
			console.log(p1Choice, p2Choice);
		}).then(function() {
			if(p1Choice === "Rock" && p2Choice === "Rock") {
				$("#outcome").text("Tie Game!");
				turn++;
				ref.update({
					turn: turn
				});
			} else if(p1Choice === "Rock" && p2Choice === "Paper") {
				p1Losses++;
				p1Ref.update({
					losses: p1Losses
				});
				p2Wins++;
				p2Ref.update({
					wins: p2Wins
				});
				p2Ref.once("value", function(snap) {
					$("#outcome").text(snap.val().name + " Wins!");
				});
				turn++;
				ref.update({
					turn: turn
				});
			} else if(p1Choice === "Rock" && p2Choice === "Scissors") {
				p1Wins++;
				p1Ref.update({
					losses: p1Wins
				});
				p2Losses++;
				p2Ref.update({
					wins: p2Losses
				});
				p1Ref.once("value", function(snap) {
					$("#outcome").text(snap.val().name + " Wins!");
				});
				turn++;
				ref.update({
					turn: turn
				});
			} else if(p1Choice === "Paper" && p2Choice === "Rock") {
				p1Wins++;
				p1Ref.update({
					losses: p1Wins
				});
				p2Losses++;
				p2Ref.update({
					wins: p2Losses
				});
				p1Ref.once("value", function(snap) {
					$("#outcome").text(snap.val().name + " Wins!");
				});
				turn++;
				ref.update({
					turn: turn
				});
			} else if(p1Choice === "Paper" && p2Choice === "Paper") {
				$("#outcome").text("Tie Game!");
				turn++;
				ref.update({
					turn: turn
				});
			} else if(p1Choice === "Paper" && p2Choice === "Scissors") {
				p1Losses++;
				p1Ref.update({
					losses: p1Losses
				});
				p2Wins++;
				p2Ref.update({
					wins: p2Wins
				});
				p2Ref.once("value", function(snap) {
					$("#outcome").text(snap.val().name + " Wins!");
				});
				turn++;
				ref.update({
					turn: turn
				});
			} else if(p1Choice === "Scissors" && p2Choice === "Rock") {
				p1Losses++;
				p1Ref.update({
					losses: p1Losses
				});
				p2Wins++;
				p2Ref.update({
					wins: p2Wins
				});
				p2Ref.once("value", function(snap) {
					$("#outcome").text(snap.val().name + " Wins!");
				});
				turn++;
				ref.update({
					turn: turn
				});
			} else if(p1Choice === "Scissors" && p2Choice === "Paper") {
				p1Wins++;
				p1Ref.update({
					losses: p1Wins
				});
				p2Losses++;
				p2Ref.update({
					wins: p2Losses
				});
				p1Ref.once("value", function(snap) {
					$("#outcome").text(snap.val().name + " Wins!");
				});
				turn++;
				ref.update({
					turn: turn
				});
			} else if(p1Choice === "Scissors" && p2Choice === "Scissors") {
				$("#outcome").text("Tie Game!");
				turn++;
				ref.update({
					turn: turn
				});
			}
		});
	}
});