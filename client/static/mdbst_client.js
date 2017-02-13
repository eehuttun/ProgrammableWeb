
/**** START CONSTANTS****/
//True or False
var DEBUG = true,
COLLECTIONJSON = "application/vnd.collection+json",
HAL = "application/hal+json",
FORUM_USER_PROFILE = "http://atlassian.virtues.fi:8090/display/PWP/Exercise+4#Exercise4-Forum_User",
FORUM_MESSAGE_PROFILE = "http://atlassian.virtues.fi:8090/display/PWP/Exercise+4#Exercise4-Forum_Message",
DEFAULT_DATATYPE = "json",
ENTRYPOINT = "/mdbst/api/movies/" //Entry point is getMovies()
/**** END CONSTANTS****/

/**** START RESTFUL CLIENT****/
/*
getMovies is the entrypoint of the application.

Sends an AJAX request to retrive the list of all the movies and directors of the application
ONSUCCESS=> Show movies in the UI list. It uses appendMovieToList for that purpose. 
The list contains the url and cover_url of the movies.
ONERROR => Show an alert to the user
*/
function getMovies() {
	var apiurl = ENTRYPOINT;
	return $.ajax({
		url: apiurl,
		dataType:DEFAULT_DATATYPE
	}).always(function(){
		//Remove old list of movies
		$("#movie_list").empty();

	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		//Extract the movies
    	movies = data.collection.items;
		for (var i=0; i < movies.length; i++){
			var movie = movies[i];
			//Extract the title by getting the data values. Once obtained
			// the title use the method appendMovieToList to show the movie
			// information in the UI.
			//Data format example:
			//  [ { "name" : "title", "value" : "The Lord of the Rings" },
			//    { "name" : "cover_url", "value" : "" } 
			//	  { "name" : "id", "value" : "123456" }]
			var movie_data = movie.data;
			for (var j=0; j<movie_data.length;j++){
				if (movie_data[j].name=="title" && movie_data[j+1].name=="cover_url" && movie_data[j+2].name=="id"){
					appendMovieToList(movie.href, movie_data[j].value, movie_data[j+1].value, movie_data[j+2].value);
				}			
			} 
		}
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		alert ("Could not fetch the list of movies.  Please, try again");
	});
}


/*
findMovie finds a movies from database based on title.

Sends an AJAX request to retrive the list of all the movies matching the query
ONSUCCESS=> Show movies in the UI list. It uses appendMovieToList for that purpose. 
The list contains the url and cover_url of the movies.
ONERROR => Show an alert to the user
*/
function findMovie(apiurl) {
	return $.ajax({
		url: apiurl,
		dataType:DEFAULT_DATATYPE
	}).always(function(){

	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		//Extract the movies
    	movies = data.collection.items;
		if (movies.length == 0) {
			alert ("No movies found.");
		}
		else {
			$("#movie_list").empty();
			for (var i=0; i < movies.length; i++){
				var movie = movies[i];

				var movie_data = movie.data;
				for (var j=0; j<movie_data.length;j++){
					if (movie_data[j].name=="title" && movie_data[j+1].name=="cover_url" && movie_data[j+2].name=="id"){
						appendMovieToList(movie.href, movie_data[j].value, movie_data[j+1].value, movie_data[j+2].value);
					}			
				} 
			}
		}

	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		//Inform user about the error using an alert message.
		alert ("No movies found.");
	});
}

/*
Sends an AJAX request to retrive the list of all the directors of the application
ONSUCCESS=> Show directors in the UI list. It uses appendDirectorToList for that purpose. 
The list contains the url of the directors.
ONERROR => Show an alert to the user
*/
function getDirectors() {
	var apiurl = "/mdbst/api/directors/";
	return $.ajax({
		url: apiurl,
		dataType:DEFAULT_DATATYPE
	}).always(function(){
		//Remove old list of directors
		$("#director_list").empty();

	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		//Extract the directors
    	directors = data.collection.items;
		for (var i=0; i < directors.length; i++){
			var director = directors[i];
			//Extract the name by getting the data values. Once obtained
			// the name use the method appendDirectorToList to show the director
			// information in the UI.
			//Data format example:
			//  [ { "name" : "name", "value" : "Peter Jackson" }]
			var director_data = director.data;
			for (var j=0; j<director_data.length;j++){
				if (director_data[j].name=="name"){
					appendDirectorToList(director.href, director_data[j].value);
				}			
			} 
		}
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		//Inform user about the error using an alert message.
		alert ("Could not fetch the list of directors.  Please, try again");
	});
}

function getMovie(apiurl) {
	return $.ajax({
		url: apiurl,
		dataType:DEFAULT_DATATYPE, 
		//headers: {"Authorization":"admin"}
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE: data:",data,"; textStatus:",textStatus)
		}
		
		var movie_links = data._links;
		var directors_url = movie_links.directors[0].href; 
        var self = movie_links.self.href;

		$("#title").val(data.title);
		$("#rating").val(data.average_rating);
		$("form#movie_public_form").attr("action",self);


	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR: textStatus:",textStatus, ";error:",errorThrown)
		}
		alert ("Cannot extract information about this movie from the database.")
	});
}
/*
Sends an AJAX request to the API to get the template for submitting new movies to database.
Creates a form from the template and shows the div where the form is put.
*/
function getMoviesForm(apiurl) {
	return $.ajax({
		url: "/mdbst/api/movies/",
		dataType:DEFAULT_DATATYPE
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE GETMOVIESFORM: data:",data,"; textStatus:",textStatus)
		}
		$form = createFormFromTemplate (data.collection.href, 
			                            data.collection.template,
			                            "create_movie_form","Create",
										"#newMovieForm",
			                            handleCreateMovie);
		$("#newMovieForm").empty();
		$("#newMovieForm").append($form);
 		$("#newMovieForm").show();
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR GETMOVIESFORM: textStatus:",textStatus, ";error:",errorThrown)
		}
		//Inform user about the error using an alert message.
		alert ("Could not create a link to create new movies.  Please, try again");
	});
}
/*
Sends an AJAX request to the API to get the template for submitting new directors to database.
Creates a form from the template and shows the div where the form is put.
*/
function getDirectorsForm(apiurl) {
	return $.ajax({
		url: "/mdbst/api/directors/",
		dataType:DEFAULT_DATATYPE
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE GETDIRECTORSFORM: data:",data,"; textStatus:",textStatus)
		}
		$form = createFormFromTemplate (data.collection.href, 
			                            data.collection.template,
			                            "create_director_form","Create",
										"#newDirectorForm",
			                            handleCreateDirector);
		$("#newDirectorForm").empty();
		$("#newDirectorForm").append($form);
 		$("#newDirectorForm").show();
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR GETDIRECTORSFORM: textStatus:",textStatus, ";error:",errorThrown)
		}
		//Inform user about the error using an alert message.
		alert ("Could not create a link to create new directors.  Please, try again");
	});
}

/*
Sends a POST request to the API with all the information gathered in the form
*/
function addMovie(url, template){
	var movieData = JSON.stringify(template);
	return $.ajax({
		headers: {'Content-Type' : 'application/json'},
		type: "POST",
		url: "/mdbst/api/movies/",
		data: movieData
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE POSTMOVIE: data:",data,"; textStatus:",textStatus)
		}
		alert("New movie created successfully!");
		location.reload(true);
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR POSTMOVIE: textStatus:",textStatus, ";error:",errorThrown)
		}
		//Inform user about the error using an alert message.
		alert ("Could not submit a new movie.  Please, try again");
	});
}
/*
Sends a POST request to the API with all the information gathered in the form
*/
function addDirector(url, template){
	var directorData = JSON.stringify(template);
	return $.ajax({
		headers: {'Content-Type' : 'application/json'},
		type: "POST",
		url: "/mdbst/api/directors/",
		data: directorData
	}).done(function (data, textStatus, jqXHR){
		if (DEBUG) {
			console.log ("RECEIVED RESPONSE POSTDIRECTOR: data:",data,"; textStatus:",textStatus)
		}
		alert("New director created successfully!");
		location.reload(true);
	}).fail(function (jqXHR, textStatus, errorThrown){
		if (DEBUG) {
			console.log ("RECEIVED ERROR POSTDIRECTOR: textStatus:",textStatus, ";error:",errorThrown)
		}
		//Inform user about the error using an alert message.
		alert ("Could not submit a new director.  Please, try again");
	});
}


/**** END RESTFUL CLIENT****/


/**** BUTTON HANDLERS ****/

/* handles the creation of form that is used to input new movies to database*/
function handleCreateMovieForm(event) {
	if (DEBUG) {
		console.log ("Triggered handleCreateMovieUserForm")
	}
	//Call the API method to extract the template
	//$this is the href
	getMoviesForm($(this).attr("href"))
	return false;
}
/* handles the creation of form that is used to input new directors to database*/
function handleCreateDirectorForm(event) {
	if (DEBUG) {
		console.log ("Triggered handleCreateDirectorForm")
	}
	//Call the API method to extract the template
	//$this is the href
	getDirectorsForm($(this).attr("href"))
	return false;
}
/* handles the submitting of new movies to database*/
function handleCreateMovie(event){
	if (DEBUG) {
		$("#newMovieForm").hide();
		console.log ("Triggered handleCreateMovie")
	}
	event.preventDefault();
	var $form = $(this);
	var template = serializeFormTemplate($form);
	var url = $form.attr("action");
	addMovie(url, template);
	$("#newMovieForm").hide();
	return false; //Avoid executing the default submit
}
/* handles the submitting of new directors to database*/
function handleCreateDirector(event){
	if (DEBUG) {
		$("#newDirectorForm").hide();
		console.log ("Triggered handleCreateDirector")
	}
	event.preventDefault();
	var $form = $(this);
	var template = serializeFormTemplate($form);
	var url = $form.attr("action");
	addDirector(url, template);
	$("#newDirectorForm").hide();
	return false; //Avoid executing the default submit
}


function handleGetMovie(event) {
	if (DEBUG) {
		console.log ("Triggered handleGetUser")
	}
	event.preventDefault();//Avoid default link behaviour

	window.open($(this).attr("href"),"_self")


	return false; //IMPORTANT TO AVOID <A> DEFAULT ACTIONS
}


function handleGetDirector(event) {
	if (DEBUG) {
		console.log ("Triggered handleGetDirector")
	}
	event.preventDefault();
	//getMovie($(this).attr("href"));
	
	var url = $(this).attr("href");
	var components = url.split("/");
	var id = components[4];
	
	window.open("/client/directors.html?id="+id,"_self")


	return false; //IMPORTANT TO AVOID <A> DEFAULT ACTIONS
}

function handleSearchMovie(event) {
	if (DEBUG) {
		console.log ("Triggered handleSearchMovie")
	}
	//event.preventDefault();
	
	var $form = $( "#searchForm" );
	//var $form = $(this).closest("form");
	$title = $form.children("input[name=searchTitle]");
	
	var title = $title.val();
	var url = "/mdbst/api/movies?title="+title;
	
	findMovie(url);
	
	return false;
	
}

/**** END BUTTON HANDLERS ****/

/**** UI HELPERS ****/

/* Create a form for adding a movie or director to the database
		PARAMETERS: url 	 - the url of the API
					template - template of the JSON object that is POSTED to API
					id 		 - id of the form
					button_name - name of the submit button
					div_name - name of the div where form is put
					handler  - handler function for the submit button
*/

function createFormFromTemplate(url,template,id,button_name,div_name,handler){
	$form=$('<form></form>');
	$form.attr("id",id);
	$form.attr("action",url);
	if (template.data) {
		for (var i =0; i<template.data.length; i++){
			var name = template.data[i].name;
			var id = name+"_id";
			var value = template.data[i].value;
			var prompt = template.data[i].prompt;
			var required = template.data[i].required;
			$input = $('<input type="text"></input>');
			$input.addClass("editable");
			$input.attr('name',name);
			$input.attr('id',id);
			if(value){
				$input.attr('value', value);
			}
			if(prompt){
				$input.attr('placeholder', prompt);
			}
			if(required){
				$input.prop('required',true);
			}
			$label_for = $('<label></label>')
			$label_for.attr("for",id);
			if(required) {
				$label_for.text(name + '*');
			}
			else {
				$label_for.text(name);
			}
			$form.append($label_for);
			$form.append($input);
		}
		$text = $('<p>*these fields are required</p>');
		$form.append($text);
		if (button_name) { 
			$button = $('<button type="submit"></button>');
			$button.attr("id",button_name);
			$button.attr("value",button_name);
			$button.text(button_name);
			$form.append($button);
			$form.submit(handler);
		}
		$button = $('<button type="button">Cancel</button>');
		$button.attr("id", "close_button");
		$button.click(function() {$(div_name).hide();});
		$form.append($button);
	}
	return $form;
}

/*
Serialize the input values from a given form into a Collection+JSON template.

INPUT:
A form jquery object. The input of the form contains the value to be extracted.

OUPUT:
A Javascript object containing each one of the inputs of the form serialized
following  the Collection+JSON template format.
*/
function serializeFormTemplate($form){
	var envelope={"template":{
								"data":[]
	}};
	// get all the inputs into an array.
    var $inputs = $form.children("input");
    $inputs.each(function(){
    	var _data = {};
		/* 
		Biography must be inside brackets.
		To not complicate the input forms the biography is modified here.
		*/
		if(this.name == "biography") {
			var _value = [];
			_value[0] = $(this).val();
			_data.name = this.name;
			_data.value = _value;
			envelope.template.data.push(_data);
		}
		else {
			_data.name = this.name;
			_data.value = $(this).val();
			envelope.template.data.push(_data);
		}
    });
    return envelope;

}

/*
Add a new li element in the #movie_list using the information received as parameter
	PARAMETERS: title => title of the movie 
	            url=> url of the new movie.
				cover_url=> url of the cover image in IMDb. 
				
*/
function appendMovieToList(url, title, cover_url, id) {
	var url = "/client/movies.html?id="+id;
	var $movie = $('<li>').html('<div class="movieContainer"><a href="'+url+'"><img src='+cover_url+' height="136" width="100"></a><a class= "user_link" href="'+url+'">'+title+'</a></div>');
	//Add to the user list
	$("#movie_list").append($movie);
	return $movie;
}

/*
Add a new li element in the #director_list using the information received as parameter
	PARAMETERS: name => name of the director 
	            url=> url of the director. 
				
*/
function appendDirectorToList(url, name) {
	var $director = $('<li>').html('<a class= "user_link" href="'+url+'">'+name+'</a>');
	//Add to the user list
	$("#director_list").append($director);
	return $director;
}
/*** END UI HELPERS***/

/*** START ON LOAD ***/
//This method is executed when the webpage is loaded.
$(function(){	

	$( "#movie_list" ).on( "click", "li a", handleGetMovie );
	$( "#addMovie" ).on( "click", handleCreateMovieForm);
	$( "#addDirector" ).on( "click", handleCreateDirectorForm);
	$( "#director_list" ).on( "click", "li a", handleGetDirector );
	$( "#searchButton" ).on( "click", handleSearchMovie );
	//Retrieve list of movies and directors from the server
	getMovies();
	getDirectors();
})
/*** END ON LOAD**/